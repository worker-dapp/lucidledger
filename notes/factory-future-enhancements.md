# Factory Future Enhancements

Follow-up improvements to the WorkContractFactory system beyond the current MVP (ManualWorkContract only).

See also: [contract-factory-architecture.md](./contract-factory-architecture.md) for the oracle modularity design.

## Multiple Contract Templates

The factory currently only deploys `ManualWorkContract`. Future versions should support multiple templates:

- **OracleWorkContract** — Integrates with on-chain oracles (GPS, image, weight, time clock) for automated verification and payment release
- **MilestoneContract** — Multi-phase contracts with partial payouts at each milestone
- Template registry: mapping of template ID → implementation bytecode, selectable at deploy time

## Contract Crafting UI for Admins

Admin page to configure and register new contract templates:

- Select base template (manual, oracle-based, milestone)
- Configure oracle requirements per template (which oracles, thresholds)
- Set default mediator rules (auto-assign, pool selection)
- Preview constructor args before on-chain registration

## Multiple Payment Token Support

Currently hardcoded to USDC on Base Sepolia. Future:

- Factory constructor accepts a list of allowed tokens (USDC, USDT, DAI, etc.)
- Employer selects payment token at contract creation time
- Token allowlist managed by admin (`addAllowedToken` / `removeAllowedToken`)

## Oracle Registry Contract

On-chain mapping of oracle type to oracle contract address:

- `oracleRegistry.getOracle("gps")` → returns GPS oracle address
- Admin can update oracle addresses without redeploying the factory
- Work contracts query the registry at verification time rather than storing oracle addresses at construction

## Admin Ownership Rotation

- `transferAdmin(address newAdmin)` function on the factory
- Two-step transfer pattern (propose + accept) to prevent accidental lockout
- Event emission for off-chain tracking of admin changes
- Consider a timelock for admin transfers in production

## Reference

The oracle modularity design in `contract-factory-architecture.md` covers how oracle-based contracts would plug into the factory pattern. The factory's `deployContract` function signature would expand to accept an oracle configuration struct.
