'use strict';
const CONFIG = { numero: '5521997125990', loja: 'Closet da Sukita' };
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const waLink = (msg) => `https://wa.me/${CONFIG.numero}?text=${encodeURIComponent(msg)}`;
const state = { products: [], cat: 'all' };
const cap = (c) => c.charAt(0).toUpperCase() + c.slice(1);
const money = (v) => typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : String(v || '');

function initWhatsApp() {
  $$('[data-wa]').forEach((el) => {
    el.href = waLink(el.dataset.wa || `Olá! Vi o site do ${CONFIG.loja} e gostaria de saber mais.`);
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });
}

function initHeader() {
  const header = $('.header'), nav = $('.nav'), btn = $('.menu');
  if (!header || !nav || !btn) return;
  const onScroll = () => header.classList.toggle('sc', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  const toggle = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    onScroll();
  };
  btn.addEventListener('click', () => toggle(!nav.classList.contains('open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { toggle(false); btn.focus(); } });
  document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) toggle(false); });
  onScroll();
  // scrollspy simples
  const links = $$('.nav a[href^="#"]:not(.btn)'), secs = $$('main section[id]');
  if (links.length && secs.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => {
        const on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('cur', on);
        on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => spy.observe(s));
  }
}

async function loadProducts() {
  try {
    const res = await fetch('products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).products || [];
  } catch { return []; }
}

function renderFilters() {
  const cats = [...new Set(state.products.map((p) => p.category).filter(Boolean))];
  const count = (c) => c === 'all' ? state.products.length : state.products.filter((p) => p.category === c).length;
  const box = $('#filtros');
  if (cats.length < 2) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = [['all', 'Todos'], ...cats.map((c) => [c, cap(c)])]
    .map(([v, t]) => `<button class="pill${v === state.cat ? ' on' : ''}" type="button" data-cat="${esc(v)}" aria-pressed="${v === state.cat}">${esc(t)}<small>${count(v)}</small></button>`).join('');
  $$('.pill', box).forEach((b) => b.addEventListener('click', () => {
    state.cat = b.dataset.cat;
    $$('.pill', box).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    $$('.card').forEach((c) => { c.hidden = state.cat !== 'all' && c.dataset.cat !== state.cat; });
  }));
}

function card(p) {
  const off = p.soldOut === true;
  const msg = off
    ? `Olá! Vi o produto ${p.name} no site da ${CONFIG.loja}. Ele está esgotado, vocês vão repor ou têm algo parecido?`
    : `Olá! Vi o produto ${p.name} no site da ${CONFIG.loja} e gostaria de saber mais sobre valores, tamanhos e disponibilidade.`;
  const price = money(p.price), old = money(p.oldPrice);
  const badge = off ? '<span class="badge badge--off">Esgotado</span>' : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : '';
  const sizes = (p.sizes || []).length ? `<div class="sizes" aria-label="Tamanhos">${p.sizes.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '';
  const focus = p.focus ? ` style="--focus:${esc(p.focus)}"` : '';
  return `<article class="card${off ? ' card--off' : ''}" data-cat="${esc(p.category)}">
    <button class="card__img" type="button" aria-label="Ampliar foto: ${esc(p.name)}"${focus}><img src="${esc(p.image)}" alt="${esc(p.alt || p.name)}" loading="lazy" width="600" height="750">${badge}</button>
    <div class="card__b">
      ${p.category ? `<span class="cat">${esc(cap(p.category))}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      <p class="price${price ? '' : ' price--none'}">${esc(price || 'Consulte o valor')}${old ? `<s>${esc(old)}</s>` : ''}</p>${sizes}
      <a class="btn btn--o" href="${waLink(msg)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#wa"/></svg>${off ? 'Avise-me quando chegar' : 'Consultar pelo WhatsApp'}</a>
    </div></article>`;
}

function initReveal() {
  const els = $$('.head, .box, .loc > *, .card, .more');
  if (!els.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('rv');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

function initLightbox() {
  const grid = $('#grid'); if (!grid) return;
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Foto ampliada');
  lb.innerHTML = '<button type="button" aria-label="Fechar foto">×</button><img alt="">';
  document.body.appendChild(lb);
  const close = $('button', lb), big = $('img', lb);
  let last = null;
  const hide = () => { lb.classList.remove('on'); last && last.focus(); };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.card__img'); if (!b) return;
    const img = $('img', b); last = b;
    big.src = img.currentSrc || img.src; big.alt = img.alt;
    lb.classList.add('on'); close.focus();
  });
  lb.addEventListener('click', (e) => { if (e.target !== big) hide(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
  });
}

function renderProducts() {
  const grid = $('#grid');
  if (!state.products.length) {
    grid.innerHTML = '<p class="vazio">Não foi possível carregar o catálogo. <a data-wa href="#">Chame a gente no WhatsApp!</a></p>';
    $('#filtros').hidden = true;
    initWhatsApp();
    return;
  }
  // ordenação opcional: featured primeiro, depois "order"; sem campos, mantém a ordem original
  state.products = state.products.map((p, i) => [p, i]).sort(([a, i], [b, j]) =>
    (b.featured === true) - (a.featured === true) || (a.order ?? 1e6) - (b.order ?? 1e6) || i - j).map(([p]) => p);
  grid.innerHTML = state.products.map(card).join('');
  renderFilters();
}

document.addEventListener('DOMContentLoaded', async () => {
  initWhatsApp();
  initHeader();
  const ano = $('#ano'); if (ano) ano.textContent = new Date().getFullYear();
  if ($('#grid')) {
    $('#grid').innerHTML = '<div class="sk" aria-hidden="true"></div>'.repeat(8);
    state.products = await loadProducts();
    renderProducts();
    initLightbox();
  }
  initReveal();
});