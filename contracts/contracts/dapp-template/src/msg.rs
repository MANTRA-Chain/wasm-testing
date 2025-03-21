use cosmwasm_schema::{cw_serde, QueryResponses};
use cw_ownable::{cw_ownable_execute, cw_ownable_query};

#[cw_serde]
pub struct InstantiateMsg {
    pub count: Option<u64>,
}

pub struct GreetResp {
    pub message: String,
}

#[cw_ownable_query]
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(CountResponse)]
    GetCount {},
}

#[cw_ownable_execute]
#[cw_serde]
pub enum ExecuteMsg {
    Increment {},
    Reset { count: u64 },
}

#[cw_serde]
pub struct CountResponse {
    pub count: u64,
}

#[cw_serde]
pub struct MigrateMsg {}
