use cosmwasm_std::{Empty, StdResult};
use cw_multi_test::{App, Contract, ContractWrapper, Executor, IntoBech32};
use dapp_template::{
    contract,
    msg::ExecuteMsg::UpdateOwnership,
    msg::{InstantiateMsg, QueryMsg},
};

pub fn the_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(contract::execute, contract::instantiate, contract::query)
        .with_migrate(contract::migrate);

    Box::new(contract)
}

#[test]
fn change_contract_ownership() {
    let mut app = App::default();
    let code_id = app.store_code(the_contract());
    let msg = InstantiateMsg { count: Some(123) };

    let admin = "admin".into_bech32();
    let alice = "alice".into_bech32();

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

    // Unauthorized attempt to change ownership
    let msg = UpdateOwnership(cw_ownable::Action::TransferOwnership {
        new_owner: alice.to_string(),
        expiry: None,
    });

    let result = app.execute_contract(alice.clone(), target.clone(), &msg, &[]);

    if result.is_ok() {
        panic!("Unauthorized attempt to change ownership should fail")
    }

    // Authorized attempt to change ownership
    app.execute_contract(admin.clone(), target.clone(), &msg, &[])
        .unwrap();

    let ownership_response: StdResult<cw_ownable::Ownership<String>> = app
        .wrap()
        .query_wasm_smart(&target, &QueryMsg::Ownership {});

    assert_eq!(ownership_response.unwrap().owner, Some(admin.to_string()));

    // accept ownership transfer
    let msg = UpdateOwnership(cw_ownable::Action::AcceptOwnership {});
    app.execute_contract(admin.clone(), target.clone(), &msg, &[])
        .unwrap_err();
    app.execute_contract(alice.clone(), target.clone(), &msg, &[])
        .unwrap();

    let ownership_response: StdResult<cw_ownable::Ownership<String>> = app
        .wrap()
        .query_wasm_smart(&target, &QueryMsg::Ownership {});

    assert_eq!(ownership_response.unwrap().owner, Some(alice.to_string()));
}
