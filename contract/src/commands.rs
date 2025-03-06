use cosmwasm_std::{DepsMut, Response};

use crate::{state::COUNT, ContractError};

/// Increments the counter by 1.
pub(crate) fn try_increment(deps: DepsMut) -> Result<Response, ContractError> {
    let mut count = COUNT.load(deps.storage)?;
    count += 1;
    COUNT.save(deps.storage, &count)?;
    Ok(Response::new()
        .add_attribute("action", "increment")
        .add_attribute("new_count", count.to_string()))
}

/// Resets the counter to a specified value.
pub(crate) fn try_reset(deps: DepsMut, count: u64) -> Result<Response, ContractError> {
    COUNT.save(deps.storage, &count)?;
    Ok(Response::new()
        .add_attribute("action", "reset")
        .add_attribute("new_count", count.to_string()))
}
