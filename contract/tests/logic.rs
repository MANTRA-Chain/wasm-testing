use cosmwasm_std::Empty;
use cw_multi_test::{App, Contract, ContractWrapper, Executor, IntoBech32};
use dapp_template::{
    contract,
    msg::{CountResponse, ExecuteMsg, InstantiateMsg, QueryMsg},
};

pub fn the_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(contract::execute, contract::instantiate, contract::query)
        .with_migrate(contract::migrate);

    Box::new(contract)
}

#[test]
fn update_counter() {
    let mut app = App::default();
    let code_id = app.store_code(the_contract());
    let msg = InstantiateMsg { count: Some(123) };

    let admin = "admin".into_bech32();

    let target = app
        .instantiate_contract(
            code_id,
            admin.clone(),
            &msg,
            &[],
            "Fee Collector",
            Some(admin.to_string()),
        )
        .unwrap();

    // Query initial counter value
    let resp: CountResponse = app
        .wrap()
        .query_wasm_smart(&target, &QueryMsg::GetCount {})
        .unwrap();
    assert_eq!(resp.count, 123);

    // Update the counter by incrementing it
    let msg = ExecuteMsg::Increment {};
    app.execute_contract(admin.clone(), target.clone(), &msg, &[])
        .unwrap();

    // Query the updated counter value
    let resp: CountResponse = app
        .wrap()
        .query_wasm_smart(&target, &QueryMsg::GetCount {})
        .unwrap();
    assert_eq!(resp.count, 124);
}
