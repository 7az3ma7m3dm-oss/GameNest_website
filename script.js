const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menu?.addEventListener('click', () => {
  const open = menu.classList.toggle('active');
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('menu-open', open);
});

document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
  menu?.classList.remove('active');
  nav?.classList.remove('menu-open');
  menu?.setAttribute('aria-expanded','false');
}));

const toast = document.querySelector('.toast');
document.querySelectorAll('.order-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const product = btn.dataset.product || 'your selected package';
    toast.textContent = `${product} â€” message us to order.`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
    document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'});
  });
});

const reveal = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      reveal.unobserve(e.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

const cursor = document.querySelector('.cursor-dot');
if (cursor && matchMedia('(pointer:fine)').matches) {
  addEventListener('mousemove', e => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });
  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter',()=>{cursor.style.width='18px';cursor.style.height='18px'});
    el.addEventListener('mouseleave',()=>{cursor.style.width='9px';cursor.style.height='9px'});
  });
}
