{
  system ? builtins.currentSystem,
  pkgs ? import ../nix { inherit system; },
  includeMantrachaind ? true,
}:
pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.test-env
    pkgs.poetry
    pkgs.just
    pkgs.cargo
    pkgs.rustc
    pkgs.rustfmt
    pkgs.clippy
  ] ++ pkgs.lib.optionals includeMantrachaind [
    pkgs.mantrachaind
  ];
  shellHook = ''
    export TMPDIR=/tmp
    # Add wasm32-unknown-unknown target
    rustup target add wasm32-unknown-unknown 2>/dev/null || true
  '';
}
