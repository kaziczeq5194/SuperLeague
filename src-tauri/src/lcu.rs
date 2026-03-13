use irelia::rest::LcuClient;
use irelia::requests::RequestClientType;
use serde_json::Value;
use base64::Engine;

/// Concrete client type alias
pub type Client = LcuClient<RequestClientType>;

/// Try to create an LCU connection via irelia. Returns None if League is not running.
pub fn get_lcu_client() -> Option<Client> {
    LcuClient::connect().ok()
}

/// Check if the LCU is reachable
pub fn check_connection() -> bool {
    get_lcu_client().is_some()
}

/// GET request via irelia (for simple endpoints like connection check)
pub async fn lcu_get(endpoint: &str) -> Result<Value, String> {
    // Try reqwest first, fall back to irelia
    match lcu_direct_get(endpoint).await {
        Ok(v) => Ok(v),
        Err(_) => {
            match get_lcu_client() {
                Some(c) => c.get::<Value>(endpoint).await.map_err(|e| e.to_string()),
                None => Ok(Value::Array(vec![])),
            }
        }
    }
}

/// GET that errors when disconnected
pub async fn lcu_get_required(endpoint: &str) -> Result<Value, String> {
    lcu_direct_get(endpoint).await
}

/// PUT request
pub async fn lcu_put(endpoint: &str, body: &Value) -> Result<bool, String> {
    get_lcu_client()
        .ok_or_else(|| "League client not connected".to_string())?
        .put::<Value, Value>(endpoint, body.clone())
        .await
        .map(|_| true)
        .map_err(|e| e.to_string())
}

// ═══════════════════════════════════════════════════════════════════════
// Direct reqwest-based LCU access
//
// Extract port + auth token from the LeagueClientUx process command line
// using sysinfo (same dep irelia uses), then make JSON requests via reqwest.
// This bypasses irelia's msgpack encoding completely.
// ═══════════════════════════════════════════════════════════════════════

/// Read port and auth token directly from the LeagueClientUx process args
fn get_lcu_credentials() -> Option<(u16, String)> {
    use sysinfo::{ProcessRefreshKind, RefreshKind, System};

    let refresh = ProcessRefreshKind::nothing()
        .with_cmd(sysinfo::UpdateKind::OnlyIfNotSet);
    let system = System::new_with_specifics(
        RefreshKind::nothing().with_processes(refresh),
    );

    // Find LeagueClientUx process
    let process = system.processes().values().find(|p: &&sysinfo::Process| {
        let name = p.name().to_string_lossy();
        name == "LeagueClientUx.exe" || name == "LeagueClientUx"
    })?;

    let mut port: Option<u16> = None;
    let mut token: Option<String> = None;

    for arg in process.cmd() {
        let s: String = arg.to_string_lossy().to_string();
        if let Some(p) = s.strip_prefix("--app-port=") {
            port = p.parse::<u16>().ok();
        }
        if let Some(t) = s.strip_prefix("--remoting-auth-token=") {
            token = Some(t.to_string());
        }
    }

    let port = port?;
    let token = token?;

    // Build Basic auth header: base64("riot:<token>")
    let encoded = base64::engine::general_purpose::STANDARD.encode(format!("riot:{}", token));
    let auth = format!("Basic {}", encoded);

    eprintln!("[LCU] Found credentials: port={} token_len={}", port, token.len());

    Some((port, auth))
}

/// Make a JSON GET request directly to the LCU
pub async fn lcu_direct_get(endpoint: &str) -> Result<Value, String> {
    let (port, auth) = get_lcu_credentials()
        .ok_or_else(|| "League client not detected".to_string())?;

    let http = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .use_native_tls()
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let url = format!("https://127.0.0.1:{}{}", port, endpoint);

    let response = http
        .get(&url)
        .header("Authorization", &auth)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    let status = response.status();
    let body = response.text().await
        .map_err(|e| format!("Read body failed: {e}"))?;

    eprintln!("[LCU] {} => {} ({} bytes)", endpoint, status.as_u16(), body.len());

    if status.is_success() {
        if body.is_empty() || body == "null" {
            Ok(Value::Null)
        } else {
            serde_json::from_str(&body)
                .map_err(|e| format!("JSON parse: {e}"))
        }
    } else {
        Err(format!("LCU {}: {}", status.as_u16(), &body[..300.min(body.len())]))
    }
}

/// Generic LCU request — reqwest for GET, irelia for mutations
pub async fn lcu_raw(method: &str, endpoint: &str, body: &Value) -> Result<Value, String> {
    if method == "GET" {
        return lcu_direct_get(endpoint).await;
    }

    let client = match get_lcu_client() {
        Some(c) => c,
        None => return Err("League client not connected".to_string()),
    };

    let result: Result<Value, _> = match method {
        "DELETE" => client.delete::<Value>(endpoint).await,
        "POST"   => client.post::<Value, Value>(endpoint, body.clone()).await,
        "PUT"    => client.put::<Value, Value>(endpoint, body.clone()).await,
        "PATCH"  => client.patch::<Value, Value>(endpoint, body.clone()).await,
        _        => return Err(format!("Unsupported method: {method}")),
    };

    result.map_err(|e| e.to_string())
}
