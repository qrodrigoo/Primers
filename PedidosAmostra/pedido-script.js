// pedido-script.js

const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs';
const TABLE_NAME = 'sample_requests';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`
};

document.addEventListener('DOMContentLoaded', () => {
  carregarPedidos();

  const copiarBtn = document.getElementById('copiarBtn');
  const statusDiv = document.getElementById('copiar-status');
  const tableBody = document.getElementById('corpoTabela');

  copiarBtn.addEventListener('click', () => {
    const linhas = Array.from(tableBody.querySelectorAll('tr')).map(tr => {
    const tds = Array.from(tr.querySelectorAll('td'));
    const tdsSemBotao = tds.slice(0, -1); // ignora o último <td> (o botão)

    return tdsSemBotao.map(td => td.textContent.trim()).join('\t');
  });


    const textoFinal = linhas.join('\n');

    navigator.clipboard.writeText(textoFinal)
      .then(() => {
        statusDiv.textContent = '✅ Data copied! Now just paste it into the spreadsheet.';
        setTimeout(() => statusDiv.textContent = '', 4000);
      })
      .catch(() => {
        statusDiv.textContent = '❌ Failed to copy data.';
        setTimeout(() => statusDiv.textContent = '', 4000);
      });
  });
});

async function carregarPedidos() {
  const tableBody = document.getElementById('corpoTabela');
  tableBody.innerHTML = ''; // limpa tabela antes de carregar

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*`, {
      headers
    });

    if (!response.ok) throw new Error('Erro ao buscar dados');

    const data = await response.json();

    if (!data.length) {
      tableBody.innerHTML = '<tr><td colspan="11">Nenhum pedido encontrado.</td></tr>';
      return;
    }

    data.forEach(row => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${row.Name || ''}</td>
        <td>${row.Sequence || ''}</td>
        <td>${row.Scale || ''}</td>
        <td>${row.Purification || ''}</td>
        <td>${row['Pos. 5'] || ''}</td>
        <td>${row['Pos. 6'] || ''}</td>
        <td>${row['Pos. 7'] || ''}</td>
        <td>${row['Pos. 8'] || ''}</td>
        <td>${row["3'"] || ''}</td>
        <td>${row["5'"] || ''}</td>
        <td><button class="btn-excluir" onclick="excluirPedido('${row.Name}', '${row.Sequence}')">🗑️</button></td>
      `;

      tableBody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = '<tr><td colspan="11">Erro ao carregar dados.</td></tr>';
  }
}

async function excluirPedido(name, sequence) {
  if (!confirm(`Tem certeza que deseja excluir o pedido:\nName: ${name}\nSequence: ${sequence}`)) return;

  try {
    const filtro = `Name=eq.${encodeURIComponent(name)}&Sequence=eq.${encodeURIComponent(sequence)}`;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?${filtro}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error(await res.text());

    alert('Pedido excluído com sucesso!');
    carregarPedidos();
  } catch (err) {
    console.error('Erro ao excluir pedido:', err);
    alert('Erro ao excluir pedido.');
  }
}