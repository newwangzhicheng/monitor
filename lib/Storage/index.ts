// import { type Context } from '../Middleware/types'
// import { type Middleware } from '../Middleware/types.d'
// import { openDB } from 'idb'

// function storageMiddleware(): Middleware<Context> {
//   const storage = new Storage()
//   return {
//     name: 'storage',
//     process(ctx) {
//       storage.store(ctx)
//     }
//   }
// }

// class Storage {
//   private ctx: Context | null = null
//   private readonly storage: IDBDatabase | null = null
//   constructor() {
//     this.storage = openDB('monitor', 1, {
//       upgrade(db) {
//     })
//   }

//   public store(ctx: Context) {
//     this.ctx = ctx
//     const { currentFlushed } = this.ctx
//     if (!currentFlushed) {
//       return
//     }
//     this.addData(currentFlushed)
//     if (this.shouldCleanup) {
//       this.cleanup()
//     }
//   }

//   public addData(data: any) {
//     const tx = this.storage.transaction('data', 'readwrite')
//     const store = tx.objectStore('data')
//     store.add(data)
//   }
// }

// export { storageMiddleware }
