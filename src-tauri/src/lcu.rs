use irelia::{rest::LcuRest, LcuError};
use serde_json::Value;

/// Attempt to create an LCU REST client. Returns None if League is not running.
pub async fn get_lcu_client() -> Option<LcuRest> {
    LcuRest::new().ok()
}

/// Check if the LCU is accessible
pub async fn check_connection() -> bool {
    if let Some(client) = get_lcu_client().await {
        // Try to ping the summoner endpoint
        let result: Result<Value, LcuError> = client
            .get("/lol-summoner/v1/current-summoner")
            .await;
        result.is_ok()
    } else {
        false
    }
}
