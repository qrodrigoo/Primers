document.addEventListener('DOMContentLoaded', async () => {
  const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs'; // (truncado aqui para exemplo)

  // Preencher campos name e sequence com dados salvos
  const abbrInput = document.getElementById('pedido-name');
  const primerInput = document.getElementById('pedido-sequence');

  const sampleData = localStorage.getItem('sampleToRequest');
  if (sampleData) {
    try {
      const { abbr, primer } = JSON.parse(sampleData);
      abbrInput.value = abbr || '';
      primerInput.value = primer || '';
    } catch (error) {
      console.error('Erro ao carregar dados da amostra:', error);
    }
  }

  // Busca as opções na Supabase
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/selection_information?select=*`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    function extrairValores(campo) {
      const todos = data
        .map(linha => linha[campo])
        .filter(Boolean)
        .flatMap(valor => valor.split('|').map(v => v.trim()));
      return [...new Set(todos)];
    }

    preencherSelect('pedido-scale', extrairValores('scales'));
    preencherSelect('pedido-purification', extrairValores('purifications'));
    preencherSelect('pos5', extrairValores('internal_modifications'));
    preencherSelect('pos6', extrairValores('internal_modifications'));
    preencherSelect('pos7', extrairValores('internal_modifications'));
    preencherSelect('pos8', extrairValores('internal_modifications'));
    preencherSelect('end3', extrairValores('end_modifications3'));
    preencherSelect('end5', extrairValores('end_modifications5'));
  } catch (error) {
    console.error('Erro ao buscar opções da Supabase:', error);
  }

  function preencherSelect(id, itens = []) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option selected> </option>';
    itens.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      sel.appendChild(opt);
    });
  }

  // Enviar pedido para Supabase
  document.getElementById('pedidoForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const dados = {
      Name: document.getElementById('pedido-name').value,
      Sequence: document.getElementById('pedido-sequence').value,
      Scale: document.getElementById('pedido-scale').value,
      Purification: document.getElementById('pedido-purification').value,
      "Pos. 5": document.getElementById('pos5').value,
      "Pos. 6": document.getElementById('pos6').value,
      "Pos. 7": document.getElementById('pos7').value,
      "Pos. 8": document.getElementById('pos8').value,
      "3'": document.getElementById('end3').value,
      "5'": document.getElementById('end5').value,
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/sample_requests`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(dados),
      });

      if (!res.ok) throw new Error(await res.text());

      alert('✅ Pedido enviado com sucesso!');
      window.location.href = '../PedidosAmostra/pedido.html';
    } catch (err) {
      console.error('❌ Erro ao enviar pedido:', err);
      alert('❌ Erro ao enviar pedido.');
    }
  });
});