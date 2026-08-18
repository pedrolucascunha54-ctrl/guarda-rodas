/* ==========================================================
   META PIXEL — Guarda Rodas
   ----------------------------------------------------------
   PARA ATIVAR: troque SEU_PIXEL_ID abaixo pelo ID numérico do
   pixel (Gerenciador de Eventos > Fontes de Dados > Pixel).
   Enquanto o ID não for preenchido, nada é carregado.
   ========================================================== */
var META_PIXEL_ID = 'SEU_PIXEL_ID';

(function () {
  if (!/^\d{6,}$/.test(META_PIXEL_ID)) return;

  // Snippet base do Meta Pixel
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');

  // Rótulo do botão que originou o clique, para separar os leads no relatório
  function contentName(link) {
    var plan = link.closest('.plan-column');
    if (plan) {
      var title = plan.querySelector('.plan-name, h3, h4');
      return 'Plano ' + (title ? title.textContent.trim() : 'indefinido');
    }
    if (link.classList.contains('whatsapp-float')) return 'Botao flutuante';
    if (link.classList.contains('nav-cta')) return 'Header';
    if (link.classList.contains('btn-large')) return 'CTA final';
    return (link.textContent || 'WhatsApp').trim().slice(0, 60);
  }

  // Todo clique em link de WhatsApp dispara Lead
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    if (!link) return;
    fbq('track', 'Lead', {
      content_name: contentName(link),
      content_category: 'WhatsApp'
    });
  });
})();
