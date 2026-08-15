export default function CareersLoading() {
  return (
    <main className='min-h-[70vh] animate-pulse bg-[#f8fbf9]'>
      <section className='border-b border-fruition-100 bg-white'>
        <div className='mx-auto max-w-[1280px] px-5 py-20 sm:px-8'>
          <div className='h-8 w-44 rounded-full bg-fruition-100' />
          <div className='mt-8 h-14 max-w-2xl rounded-2xl bg-slate-100' />
          <div className='mt-4 h-6 max-w-xl rounded-xl bg-slate-100' />
        </div>
      </section>
      <section className='mx-auto max-w-[1280px] px-5 py-12 sm:px-8'>
        <div className='h-44 rounded-3xl border border-slate-200 bg-white' />
        <div className='mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className='h-72 rounded-3xl border border-slate-200 bg-white' />)}
        </div>
      </section>
    </main>
  );
}
