use crate::game_state::BiomeState;

pub const STAGE_THRESHOLDS: [u32; 7] = [0, 5, 10, 15, 20, 25, 30];

pub struct ActionDef {
    pub name: &'static str,
    pub unlock_stage: u32,
    pub points: u32,
}

pub fn action_definitions() -> Vec<ActionDef> {
    vec![
        ActionDef { name: "plant_seed", unlock_stage: 1, points: 2 },
        ActionDef { name: "water_plant", unlock_stage: 2, points: 1 },
        ActionDef { name: "add_nutrients", unlock_stage: 3, points: 3 },
        ActionDef { name: "tend_ecosystem", unlock_stage: 4, points: 2 },
    ]
}

pub fn stage_for_points(points: u32) -> u32 {
    let mut stage = 0;
    for (i, &threshold) in STAGE_THRESHOLDS.iter().enumerate() {
        if points >= threshold {
            stage = i as u32;
        }
    }
    stage
}

pub fn unlocked_actions_for_stage(stage: u32) -> Vec<String> {
    action_definitions()
        .into_iter()
        .filter(|a| stage >= a.unlock_stage)
        .map(|a| a.name.to_string())
        .collect()
}

pub fn complete_session(state: &mut BiomeState, duration_minutes: u32) {
    state.progress_points += 1;
    state.total_sessions += 1;
    state.current_stage = stage_for_points(state.progress_points);
    state.unlocked_actions = unlocked_actions_for_stage(state.current_stage);
    state.last_updated = chrono::Utc::now();
    state.session_history.push(crate::game_state::Session {
        date: state.last_updated,
        duration_minutes,
        actions_performed: vec![],
    });
}

pub fn apply_action(state: &mut BiomeState, action_name: &str) -> Result<(), String> {
    let def = action_definitions()
        .into_iter()
        .find(|a| a.name == action_name)
        .ok_or_else(|| format!("Unknown action: {action_name}"))?;

    if state.current_stage < def.unlock_stage {
        return Err(format!(
            "Action '{action_name}' requires stage {}, current stage is {}",
            def.unlock_stage, state.current_stage
        ));
    }

    state.progress_points += def.points;
    state.current_stage = stage_for_points(state.progress_points);
    state.unlocked_actions = unlocked_actions_for_stage(state.current_stage);
    state.last_updated = chrono::Utc::now();

    if let Some(last_session) = state.session_history.last_mut() {
        last_session.actions_performed.push(action_name.to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stage_for_points_at_stage_boundaries() {
        assert_eq!(stage_for_points(0), 0);
        assert_eq!(stage_for_points(4), 0);
        assert_eq!(stage_for_points(5), 1);
        assert_eq!(stage_for_points(29), 5);
        assert_eq!(stage_for_points(30), 6);
        assert_eq!(stage_for_points(100), 6);
    }

    #[test]
    fn complete_session_adds_one_point_and_records_history() {
        let mut state = BiomeState::new();
        complete_session(&mut state, 25);

        assert_eq!(state.progress_points, 1);
        assert_eq!(state.total_sessions, 1);
        assert_eq!(state.current_stage, 0);
        assert_eq!(state.session_history.len(), 1);
        assert_eq!(state.session_history[0].duration_minutes, 25);
    }

    #[test]
    fn complete_session_advances_stage_at_threshold() {
        let mut state = BiomeState::new();
        state.progress_points = 4;
        complete_session(&mut state, 25);

        assert_eq!(state.progress_points, 5);
        assert_eq!(state.current_stage, 1);
        assert_eq!(state.unlocked_actions, vec!["plant_seed".to_string()]);
    }

    #[test]
    fn apply_action_rejects_locked_action() {
        let mut state = BiomeState::new();
        let result = apply_action(&mut state, "water_plant");
        assert!(result.is_err());
        assert_eq!(state.progress_points, 0);
    }

    #[test]
    fn apply_action_rejects_unknown_action() {
        let mut state = BiomeState::new();
        state.current_stage = 5;
        let result = apply_action(&mut state, "dance");
        assert!(result.is_err());
    }

    #[test]
    fn apply_action_adds_points_and_updates_last_session() {
        let mut state = BiomeState::new();
        complete_session(&mut state, 25); // stage 0, 1 point
        state.progress_points = 5;
        state.current_stage = 1;

        apply_action(&mut state, "plant_seed").unwrap();

        assert_eq!(state.progress_points, 7);
        assert_eq!(
            state.session_history.last().unwrap().actions_performed,
            vec!["plant_seed".to_string()]
        );
    }
}
