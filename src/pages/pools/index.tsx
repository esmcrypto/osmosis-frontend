import React, { FunctionComponent } from 'react';
import { observer } from 'mobx-react-lite';
import { LabsOverview } from './LabsOverview';
import { IncentivizedPools, MyPools } from './IncentivizedPools';
import { AllPools } from './AllPools';

export const PoolsPage: FunctionComponent = observer(() => {
	return (
		<div className="w-full h-full">
			<div className="py-10 w-full px-10">
				<div className="max-w-max mx-auto">
					<LabsOverview />
				</div>
			</div>
			<div className="py-10 bg-surface w-full px-10">
				<div className="max-w-max mx-auto">
					<MyPools />
					<div className="mt-15">
						<IncentivizedPools />
					</div>
					<div className="mt-15">
						<AllPools />
					</div>
				</div>
			</div>
		</div>
	);
});
