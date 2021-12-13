import { Database } from "../Database";
import { createBannedSQL } from "../mysql";

type DisposableCallback<DisposableType, DisposableReturnType> = (
	disposable: DisposableType
) => DisposableReturnType;

type DisposableCallbackAsync<DisposableType, DisposableReturnType> = (
	disposable: DisposableType
) => Promise<DisposableReturnType>;

class TestDisposable {
	constructor(
		public id: string
	){}
	iPromise(){
		console.log(`${this.id}: iPromise called`)
		return new Promise( (resolve,reject)=>{
			setTimeout( () => { resolve(`${this.id}: iPromise delayed resolve`) }, 2000);
		});
	}
	use() {
		console.log(`${this.id}: use() called`);
		return `${this.id}: returned from use()`;
	}
	dispose() {
		console.log(`${this.id}: dispose() called`);
	}
}

export function withDisposable<DisposableType, DisposableReturnType>(
	disposable: DisposableType,
	methodName: keyof DisposableType
): (
	cb: DisposableCallback<DisposableType, DisposableReturnType>
) => DisposableReturnType {
	if (!(methodName in disposable)) {
		throw new Error(
			`Disposable does not contain a public function, ${methodName}().`
		);
	}
	if (typeof disposable[methodName] !== 'function') {
		throw new Error(
			`Unable to curry disposable.  '${methodName}' not a function.`
		);
	} else {
		return (
			cb: DisposableCallback<DisposableType, DisposableReturnType>
		) => {
			const result = cb(disposable);
			(disposable[methodName] as unknown as CallableFunction)();
			return result;
		};
	}
}

export function withDisposableAsync<DisposableType, DisposableReturnType>(
	disposable: DisposableType,
	methodName: keyof DisposableType
): (
	cb: DisposableCallbackAsync<DisposableType, DisposableReturnType>
) => Promise<DisposableReturnType> {
	if (!(methodName in disposable)) {
		throw new Error(
			`Disposable does not contain a public function, ${methodName}().`
		);
	}
	if (typeof disposable[methodName] !== 'function') {
		throw new Error(
			`Unable to curry disposable.  '${methodName}' not a function.`
		);
	} else {
		return async (
			cb: DisposableCallbackAsync<DisposableType, DisposableReturnType>
		) => {
			return await cb(disposable).finally(()=>{
				(disposable[methodName] as unknown as CallableFunction)();
			})
		};
	}
}

const a = new TestDisposable('a');
let dispResult = withDisposable(
	a,
	'dispose'
)((disposed) => {
	const result = disposed.use();
	return result;
});

console.log('after dispose', dispResult);

(async function(){
	const b = new TestDisposable('b');
	let asyncResult = await withDisposableAsync(b, 'dispose')(async (testDisposable) => {
		return testDisposable.iPromise();
	});

	console.log('awaited result', asyncResult);
})()

console.log(createBannedSQL)