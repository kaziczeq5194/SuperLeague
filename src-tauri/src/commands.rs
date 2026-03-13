use serde_json::Value;
use tauri::State;

use crate::state::AppState;
use crate::lcu::*;

// ── Connection ──

#[tauri::command]
pub async fn get_connection_status(state: State<'_, AppState>) -> Result<Value, String> {
    let connected = check_connection().await;
    *state.lcu_connected.lock().unwrap() = connected;

    if connected {
        if let Some(client) = get_lcu_client().await {
            let summoner: Result<Value, _> = client.get("/lol-summoner/v1/current-summoner").await;
            if let Ok(s) = summoner {
                return Ok(serde_json::json!({
                    "connected": true,
                    "summonerName": s.get("displayName").and_then(|v| v.as_str()).unwrap_or(""),
                    "region": ""
                }));
            }
        }
    }

    Ok(serde_json::json!({ "connected": false }))
}

#[tauri::command]
pub async fn refresh_connection(state: State<'_, AppState>) -> Result<Value, String> {
    get_connection_status(state).await
}

// ── Summoner ──

#[tauri::command]
pub async fn get_current_summoner() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-summoner/v1/current-summoner")
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("League client not connected".to_string())
    }
}

// ── Challenges ──

#[tauri::command]
pub async fn get_challenges() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-challenges/v1/challenges/local-player/")
            .await
            .map_err(|e| e.to_string())
    } else {
        Ok(Value::Array(vec![]))
    }
}

#[tauri::command]
pub async fn get_challenges_summary() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-challenges/v1/summary-player-data/local-player")
            .await
            .map_err(|e| e.to_string())
    } else {
        Ok(serde_json::json!({}))
    }
}

// ── Mastery ──

#[tauri::command]
pub async fn get_champion_masteries() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-champion-mastery/v1/championship-mastery/top?count=200")
            .await
            .map_err(|e| e.to_string())
    } else {
        Ok(Value::Array(vec![]))
    }
}

#[tauri::command]
pub async fn get_champion_mastery(champion_id: i64) -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>(&format!(
                "/lol-champion-mastery/v1/local-player/champion-mastery/by-champion-id/{}",
                champion_id
            ))
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("League client not connected".to_string())
    }
}

// ── Lobby ──

#[tauri::command]
pub async fn get_lobby_members() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-lobby/v2/lobby/members")
            .await
            .map_err(|e| e.to_string())
    } else {
        Ok(Value::Array(vec![]))
    }
}

// ── Eternals ──

#[tauri::command]
pub async fn get_eternals() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-eternals/v1/stats-summaries/")
            .await
            .map_err(|_| "".to_string())
            .unwrap_or(Ok(Value::Array(vec![])))
            .map_err(|e: String| e)
    } else {
        Ok(Value::Array(vec![]))
    }
}

// ── Skins ──

#[tauri::command]
pub async fn get_owned_skins() -> Result<Value, String> {
    if let Some(client) = get_lcu_client().await {
        client
            .get::<Value>("/lol-champions/v1/inventories/local-player/skins-minimal")
            .await
            .map_err(|e| e.to_string())
    } else {
        Ok(Value::Array(vec![]))
    }
}

// ── Match History (from DB) ──

#[tauri::command]
pub async fn get_match_history(
    state: State<'_, AppState>,
    count: i64,
) -> Result<Value, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare(
            "SELECT id, account_id, match_id, champion_id, mastery_gained, result, timestamp, game_data
             FROM match_history ORDER BY timestamp DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows: Vec<Value> = stmt
        .query_map([count], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "accountId": row.get::<_, i64>(1)?,
                "matchId": row.get::<_, String>(2)?,
                "championId": row.get::<_, i64>(3)?,
                "masteryGained": row.get::<_, i64>(4)?,
                "result": row.get::<_, String>(5)?,
                "timestamp": row.get::<_, i64>(6)?,
                "gameData": row.get::<_, Option<String>>(7)?.unwrap_or_default(),
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(Value::Array(rows))
}

#[tauri::command]
pub async fn get_champion_match_history(
    state: State<'_, AppState>,
    champion_id: i64,
) -> Result<Value, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare(
            "SELECT id, account_id, match_id, champion_id, mastery_gained, result, timestamp, game_data
             FROM match_history WHERE champion_id = ?1 ORDER BY timestamp DESC LIMIT 50",
        )
        .map_err(|e| e.to_string())?;

    let rows: Vec<Value> = stmt
        .query_map([champion_id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "championId": row.get::<_, i64>(3)?,
                "masteryGained": row.get::<_, i64>(4)?,
                "result": row.get::<_, String>(5)?,
                "timestamp": row.get::<_, i64>(6)?,
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(Value::Array(rows))
}

// ── Mastery Snapshots (from DB) ──

#[tauri::command]
pub async fn get_mastery_snapshots(
    state: State<'_, AppState>,
    champion_id: Option<i64>,
) -> Result<Value, String> {
    let db = state.db.lock().unwrap();

    let rows: Vec<Value> = if let Some(cid) = champion_id {
        let mut stmt = db
            .prepare("SELECT id, account_id, champion_id, mastery_level, mastery_points, snapshot_date FROM mastery_snapshots WHERE champion_id = ?1 ORDER BY snapshot_date DESC LIMIT 100")
            .map_err(|e| e.to_string())?;
        stmt.query_map([cid], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "championId": row.get::<_, i64>(2)?,
                "masteryLevel": row.get::<_, i64>(3)?,
                "masteryPoints": row.get::<_, i64>(4)?,
                "snapshotDate": row.get::<_, String>(5)?,
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect()
    } else {
        vec![]
    };

    Ok(Value::Array(rows))
}

#[tauri::command]
pub async fn get_daily_mastery(
    state: State<'_, AppState>,
    days: i64,
) -> Result<Value, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare("SELECT id, account_id, date, total_gained, details FROM daily_mastery ORDER BY date DESC LIMIT ?1")
        .map_err(|e| e.to_string())?;

    let rows: Vec<Value> = stmt
        .query_map([days], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "accountId": row.get::<_, i64>(1)?,
                "date": row.get::<_, String>(2)?,
                "totalGained": row.get::<_, i64>(3)?,
                "details": row.get::<_, Option<String>>(4)?.unwrap_or_default(),
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(Value::Array(rows))
}

// ── Profile ──

#[tauri::command]
pub async fn set_profile_icon(icon_id: i64) -> Result<bool, String> {
    if let Some(client) = get_lcu_client().await {
        let body = serde_json::json!({ "profileIconId": icon_id });
        client
            .put::<Value, Value>("/lol-summoner/v1/current-summoner/icon", &body)
            .await
            .map(|_| true)
            .map_err(|e| e.to_string())
    } else {
        Err("League client not connected".to_string())
    }
}

#[tauri::command]
pub async fn set_status(message: String) -> Result<bool, String> {
    if let Some(client) = get_lcu_client().await {
        let body = serde_json::json!({ "statusMessage": message });
        client
            .put::<Value, Value>("/lol-chat/v1/me", &body)
            .await
            .map(|_| true)
            .map_err(|e| e.to_string())
    } else {
        Err("League client not connected".to_string())
    }
}

#[tauri::command]
pub async fn set_ranked_display(queue: String) -> Result<bool, String> {
    if let Some(client) = get_lcu_client().await {
        let body = serde_json::json!({ "queueType": queue });
        client
            .put::<Value, Value>("/lol-ranked/v1/ranked-stats/local-player/preferred-queue", &body)
            .await
            .map(|_| true)
            .map_err(|e| e.to_string())
    } else {
        Err("League client not connected".to_string())
    }
}

// ── Debug: Generic LCU Request ──

#[tauri::command]
pub async fn lcu_request(request: serde_json::Value) -> Result<Value, String> {
    let method = request["method"].as_str().unwrap_or("GET");
    let endpoint = request["endpoint"].as_str().unwrap_or("/");
    let body = request.get("body").cloned();

    if let Some(client) = get_lcu_client().await {
        let result: Result<Value, _> = match method {
            "GET" => client.get(endpoint).await,
            "DELETE" => client.delete(endpoint).await,
            "POST" => {
                let b = body.unwrap_or(Value::Null);
                client.post(endpoint, &b).await
            }
            "PUT" => {
                let b = body.unwrap_or(Value::Null);
                client.put(endpoint, &b).await
            }
            "PATCH" => {
                let b = body.unwrap_or(Value::Null);
                client.patch(endpoint, &b).await
            }
            _ => return Err("Unsupported HTTP method".to_string()),
        };

        match result {
            Ok(v) => Ok(serde_json::json!({
                "status": 200,
                "body": serde_json::to_string_pretty(&v).unwrap_or_default(),
                "headers": {}
            })),
            Err(e) => Ok(serde_json::json!({
                "status": 500,
                "body": e.to_string(),
                "headers": {}
            })),
        }
    } else {
        Ok(serde_json::json!({
            "status": 0,
            "body": "League client not connected",
            "headers": {}
        }))
    }
}

// ── Accounts ──

#[tauri::command]
pub async fn get_accounts(state: State<'_, AppState>) -> Result<Value, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare("SELECT id, puuid, summoner_name, region, is_active FROM accounts")
        .map_err(|e| e.to_string())?;

    let rows: Vec<Value> = stmt
        .query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "puuid": row.get::<_, String>(1)?,
                "summonerName": row.get::<_, String>(2)?,
                "region": row.get::<_, String>(3)?,
                "isActive": row.get::<_, bool>(4)?,
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(Value::Array(rows))
}

#[tauri::command]
pub async fn switch_account(state: State<'_, AppState>, account_id: i64) -> Result<bool, String> {
    let db = state.db.lock().unwrap();
    db.execute("UPDATE accounts SET is_active = 0", [])
        .map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE accounts SET is_active = 1 WHERE id = ?1",
        [account_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn add_account(
    state: State<'_, AppState>,
    account: serde_json::Value,
) -> Result<bool, String> {
    let db = state.db.lock().unwrap();
    db.execute(
        "INSERT OR REPLACE INTO accounts (puuid, summoner_name, region, is_active) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![
            account["puuid"].as_str().unwrap_or(""),
            account["summonerName"].as_str().unwrap_or(""),
            account["region"].as_str().unwrap_or(""),
            account["isActive"].as_bool().unwrap_or(false) as i64,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

// ── Discord Webhook ──

#[tauri::command]
pub async fn send_discord_webhook(webhook_url: String, content: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({ "content": content });
    let res = client
        .post(&webhook_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(res.status().is_success())
}
