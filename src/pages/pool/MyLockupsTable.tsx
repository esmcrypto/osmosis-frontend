import React, { FunctionComponent, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores';
import { CoinPretty, Dec } from '@keplr-wallet/unit';
import { TToastType, useToast } from '../../components/common/toasts';

const tableWidths = ['25%', '25%', '25%', '25%'];
export const MyLockupsTable: FunctionComponent<{
	poolId: string;
}> = observer(({ poolId }) => {
	const { chainStore, accountStore, queriesStore, priceStore } = useStore();

	const account = accountStore.getAccount(chainStore.current.chainId);
	const queries = queriesStore.get(chainStore.current.chainId);
	const poolShareCurrency = queries.osmosis.queryGammPoolShare.getShareCurrency(poolId);

	const lockableDurations = queries.osmosis.queryLockableDurations.lockableDurations;

	return (
		<React.Fragment>
			<h6 className="mb-1">My Bondings</h6>
			<table className="w-full">
				<LockupTableHeader />
				<tbody className="w-full">
					{lockableDurations.map(lockableDuration => {
						const lockedCoin = queries.osmosis.queryAccountLocked
							.get(account.bech32Address)
							.getLockedCoinWithDuration(poolShareCurrency, lockableDuration);
						return (
							<LockupTableRow
								key={lockableDuration.humanize()}
								duration={lockableDuration.humanize()}
								lockup={lockedCoin}
								apy={`${queries.osmosis.queryIncentivizedPools
									.computeAPY(poolId, lockableDuration, priceStore, priceStore.getFiatCurrency('usd')!)
									.toString()}%`}
							/>
						);
					})}
				</tbody>
			</table>
		</React.Fragment>
	);
});

const LockupTableHeader: FunctionComponent = () => {
	let i = 0;
	return (
		<thead>
			<tr className="flex items-center w-full border-b pl-12.5 pr-15 bg-card rounded-t-2xl mt-5 w-full text-white-mid">
				<td className="flex items-center px-2 py-3" style={{ width: tableWidths[i++] }}>
					<p>Bonding Duration</p>
				</td>
				<td className="flex items-center px-2 py-3" style={{ width: tableWidths[i++] }}>
					<p>Current APY</p>
				</td>
				<td className="flex items-center px-2 py-3" style={{ width: tableWidths[i++] }}>
					<p>Amount</p>
				</td>
				<td className="flex items-center px-2 py-3 justify-end" style={{ width: tableWidths[i++] }}>
					<p>Action</p>
				</td>
			</tr>
		</thead>
	);
};

const LockupTableRow: FunctionComponent<{
	duration: string;
	apy: string;
	lockup: {
		amount: CoinPretty;
		lockIds: string[];
	};
}> = observer(({ duration, apy, lockup }) => {
	const { chainStore, accountStore } = useStore();

	const account = accountStore.getAccount(chainStore.current.chainId);

	const [isUnlocking, setIsUnlocking] = useState(false);

	const toast = useToast();

	let i = 0;
	return (
		<tr style={{ height: `76px` }} className="flex items-center w-full border-b pl-12.5 pr-15">
			<td className="flex items-center px-2 py-3" style={{ width: tableWidths[i++] }}>
				<p>{duration}</p>
			</td>
			<td className="flex items-center px-2 py-3" style={{ width: tableWidths[i++] }}>
				<p>{apy}</p>
			</td>
			<td className="flex items-center px-2 py-3" style={{ width: tableWidths[i++] }}>
				<p>
					{lockup.amount
						.maxDecimals(6)
						.trim(true)
						.toString()}
				</p>
			</td>
			<td className="flex items-center justify-end px-2 py-3" style={{ width: tableWidths[i++] }}>
				<button
					className="disabled:opacity-50"
					disabled={!account.isReadyToSendMsgs || lockup.amount.toDec().equals(new Dec(0))}
					onClick={async e => {
						e.preventDefault();

						if (account.isReadyToSendMsgs) {
							try {
								setIsUnlocking(true);

								// 현재 lockup 모듈의 구조상의 한계로 그냥 락업된 전체 토큰을 다 언락시키도록 한다.
								// TODO: 락이 여러번에 거쳐서 많은 수가 있다면 가스 리밋의 한계로 tx를 보내는게 불가능 할 수 있다.
								//       그러므로 최대 메세지 숫자를 제한해야한다.
								await account.osmosis.sendBeginUnlockingMsg(lockup.lockIds, '', tx => {
									setIsUnlocking(false);

									if (tx.code) {
										toast.displayToast(TToastType.TX_FAILED, { message: tx.log });
									} else {
										toast.displayToast(TToastType.TX_SUCCESSFULL, {
											customLink: chainStore.current.explorerUrlToTx!.replace('{txHash}', tx.hash),
										});
									}
								});

								toast.displayToast(TToastType.TX_BROADCASTING);
							} catch (e) {
								setIsUnlocking(false);
								toast.displayToast(TToastType.TX_FAILED, { message: e.message });
							}
						}
					}}>
					{isUnlocking ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
							viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
							<path
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								className="opacity-75"
							/>
						</svg>
					) : (
						<p className="text-enabledGold">Unbond All</p>
					)}
				</button>
			</td>
		</tr>
	);
});
