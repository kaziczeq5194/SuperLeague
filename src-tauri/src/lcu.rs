use irelia::rest::LcuClient;
use irelia::requests::RequestClientType;
use serde_json::Value;

/// Concrete client type alias
pub type Client = LcuClient<RequestClientType>;

/// Try to create an LCU connection. Returns None if League is not running.
pub fn get_lcu_client() -> Option<Client> {
    LcuClient::connect().ok()
}

/// Check if the LCU is reachable
pub fn check_connection() -> bool {
    get_lcu_client().is_some()
}

/// GET request via irelia (kept for backward compat — e.g. connection check)
pub async fn lcu_get(endpoint: &str) -> Result<Value, String> {
    match get_lcu_client() {
        Some(c) => c.get::<Value>(endpoint).await.map_err(|e| e.to_string()),
        None => Ok(Value::Array(vec![])),
    }
}

/// GET that errors when disconnected
pub async fn lcu_get_required(endpoint: &str) -> Result<Value, String> {
    get_lcu_client()
        .ok_or_else(|| "League client not connected".to_string())?
        .get::<Value>(endpoint)
        .await
        .map_err(|e| e.to_string())
}

/// PUT request returning bool
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
// WHY: irelia uses MessagePack encoding for requests/responses (not JSON).
// Some LCU endpoints return data that fails msgpack→serde_json::Value
// deserialization, causing silent failures.
//
// FIX: Extract the port + auth header from irelia's connected client,
// then make standard JSON requests via reqwest.
// ═══════════════════════════════════════════════════════════════════════

/// Extract connection info from irelia's client and do a JSON GET via reqwest
pub async fn lcu_direct_get(endpoint: &str) -> Result<Value, String> {
    // Get port + auth from irelia (it already found the process / lockfile)
    let client = get_lcu_client()
        .ok_or_else(|| "League client not connected".to_string())?;

    let addr = client.url();
    let auth_header = client.auth_header().to_str()
        .map_err(|e| format!("Invalid auth header: {e}"))?
        .to_string();

    let http = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let url = format!("https://{}{}", addr, endpoint);

    let response = http
        .get(&url)
        .header("Authorization", &auth_header)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    let status = response.status();
    let body = response.text().await
        .map_err(|e| format!("Read body failed: {e}"))?;

    if status.is_success() {
        if body.is_empty() || body == "null" {
            Ok(Value::Null)
        } else {
            serde_json::from_str(&body)
                .map_err(|e| format!("JSON parse: {e} (body: {})", &body[..100.min(body.len())]))
        }
    } else {
        Err(format!("LCU {}: {}", status.as_u16(), &body[..300.min(body.len())]))
    }
}

/// Generic request — tries reqwest (JSON) first, falls back to irelia
pub async fn lcu_raw(method: &str, endpoint: &str, body: &Value) -> Result<Value, String> {
    // For GET: use reqwest directly (JSON headers, most reliable)
    if method == "GET" {
        return lcu_direct_get(endpoint).await;
    }

    // For other methods: use irelia
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
