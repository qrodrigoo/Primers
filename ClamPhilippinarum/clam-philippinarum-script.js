// AQUI: Usamos a sintaxe de importação de módulos ES6
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuração do Supabase (Substitua pelos seus dados REAIS)
// Sua chave real é: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTUxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs
const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co'; 
// !!! IMPORTANTE: SUBSTITUA ESTA CHAVE POR UMA NOVA E VÁLIDA DO SEU SUPABASE !!!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs'; // <<< SUBSTITUA ESTA LINHA COM A CHAVE ATUALIZADA

// Agora, 'createClient' é uma função importada, não uma variável global 'Supabase'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais para armazenar os dados e o estado da UI
let allSeabassSamples = [];
// allBoxLocations AGORA armazenará um ARRAY de locais para cada abbr
let allBoxLocations = {}; 
let selectedRowIndex = -1; // Para rastrear a linha selecionada na tabela
let filteredSamples = [];

// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const seabassTableBody = document.querySelector('#seabassTable tbody');
const allBoxesContainer = document.getElementById('allBoxesContainer');

// --- Teste de Conexão Supabase ---
async function testSupabaseConnection() {
    console.log("--- Iniciando Teste de Conexão Supabase ---");
    try {
        const { data, error } = await supabase
            .from('Clam_Philippinarum') // Tente buscar de uma de suas tabelas principais
            .select('abbr') // Apenas busca uma coluna para um teste rápido
            .limit(1);
 
        if (error) {
            console.error("ERRO na CONEXÃO Supabase:", error.message);
            // Se houver erro de conexão, alertar o usuário para verificar a chave/URL
            alert("Erro de conexão com o Supabase. Verifique a URL e a chave API no script.js.");
            return false;
        }
        console.log("CONEXÃO BEM SUCEDIDA! Dados de teste recebidos:", data);
        return true;
    } catch (error) {
        console.error("ERRO inesperado no Teste de Conexão Supabase:", error);
        alert("Erro inesperado durante o teste de conexão do Supabase.");
        return false;
    } finally {
        console.log("--- Fim do Teste de Conexão Supabase ---");
    }
}

// --- Funções para Caixas de Localização ---
function initializeLocationBoxes() {
    console.log("initializeLocationBoxes: Iniciando a criação das caixas de localização.");
    allBoxesContainer.innerHTML = ''; // Limpa qualquer caixa existente
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    for (let boxNum = 1; boxNum <= boxCount; boxNum++) {
        const boxGroup = document.createElement('div');
        boxGroup.classList.add('box-group');

        const boxTitleVertical = document.createElement('div');
        boxTitleVertical.classList.add('box-title-vertical');
        boxTitleVertical.textContent = `Box ${boxNum}`;
        boxGroup.appendChild(boxTitleVertical);

        const boxContainerIndividual = document.createElement('div');
        boxContainerIndividual.classList.add('box-container-individual');

        const rowLabelsBox = document.createElement('div');
        rowLabelsBox.classList.add('row-labels-box');
        rowLabels.forEach(label => {
            const rowLabelDiv = document.createElement('div');
            rowLabelDiv.classList.add('row-label');
            rowLabelDiv.textContent = label;
            rowLabelsBox.appendChild(rowLabelDiv);
        });
        boxContainerIndividual.appendChild(rowLabelsBox);

        const locationBoxGrid = document.createElement('div');
        locationBoxGrid.classList.add('location-box-grid');

        for (let row = 0; row < 10; row++) {
            for (let col = 1; col <= 10; col++) {
                const circle = document.createElement('div');
                circle.classList.add('location-circle');
                const rowChar = String.fromCharCode(65 + row); // A, B, C...
                const wellId = `${rowChar}${col}`;
                circle.textContent = wellId; 
                circle.dataset.box = boxNum;
                circle.dataset.well = wellId; 
                locationBoxGrid.appendChild(circle);
            }
        }
        boxContainerIndividual.appendChild(locationBoxGrid);
        boxGroup.appendChild(boxContainerIndividual);
        allBoxesContainer.appendChild(boxGroup);
    }
    console.log(`initializeLocationBoxes: ${boxCount} caixas de localização criadas no DOM.`);
}

async function fetchBoxLocations() {
    console.log("fetchBoxLocations: Tentando buscar localizações da caixa...");
    try {
        const { data, error } = await supabase
            .from('Clam_BOX')
            .select('abbr, box, "box.location"'); // Use aspas duplas para "box.location"

        if (error) {
            console.error("fetchBoxLocations: ERRO ao buscar localizações da caixa:", error.message);
            return {}; 
        }

        console.log("fetchBoxLocations: Dados brutos de Clam_BOX recebidos:", data);

        const mappedLocations = {};
        data.forEach(item => {
            if (item.abbr && item.box && item['box.location']) {
                // Garante que haja um array para o abbr, caso já não exista
                if (!mappedLocations[item.abbr]) {
                    mappedLocations[item.abbr] = [];
                }
                // Adiciona a localização (box e well) ao array do abbr. 
                // O 'type' (stock/diluted) será determinado no highlightLocation.
                mappedLocations[item.abbr].push({
                    box: item.box,
                    well: item['box.location']
                });
            } else {
                console.warn("fetchBoxLocations: Item de localização incompleto ignorado (faltando abbr, box ou box.location):", item);
            }
        });
        allBoxLocations = mappedLocations;
        console.log("fetchBoxLocations: Mapeamento final de localizações (incluindo múltiplas):", allBoxLocations);
        return mappedLocations;
    } catch (error) {
        console.error("fetchBoxLocations: ERRO inesperado ao buscar localizações da caixa:", error);
        return {};
    }
}

// ESTA É A FUNÇÃO MAIS IMPORTANTE PARA AS CORES
function highlightLocation(abbr) {
    console.log("highlightLocation: Tentando destacar localização para abbr:", abbr);

    // 1. Limpa todos os destaques anteriores
    document.querySelectorAll('.location-circle.active-stock, .location-circle.active-diluted, .location-circle.active-mixed')
        .forEach(circle => {
            circle.classList.remove('active-stock', 'active-diluted', 'active-mixed');
        });

    if (!abbr || !allBoxLocations[abbr] || allBoxLocations[abbr].length === 0) {
        console.warn(`highlightLocation: Nenhuma localização encontrada para '${abbr}'.`);
        return;
    }

    const locations = allBoxLocations[abbr];

    // 2. Acumula o estado de cada círculo (por caixa e poço)
    const circleStates = {}; // Ex: { '1-C9': { stock: true, diluted: true } }

    locations.forEach(location => {
        const key = `${location.box}-${location.well}`;
        const rowLetter = location.well.charAt(0).toUpperCase();
        let type = 'stock'; // padrão

        // Regras reais para determinar se é diluted ou stock (conforme linhas)
        if (['B', 'D', 'F', 'H', 'J'].includes(rowLetter)) {
            type = 'diluted';
        } else if (['A', 'C', 'E', 'G', 'I'].includes(rowLetter)) {
            type = 'stock';
        } else {
            console.warn(`Linha desconhecida em '${location.well}' — assumindo stock.`);
        }


        if (!circleStates[key]) {
            circleStates[key] = { stock: false, diluted: false };
        }

        circleStates[key][type] = true;
    });

    // 3. Aplica as classes corretas nos círculos
    let scrolledToFirst = false;

    for (const key in circleStates) {
        const [box, well] = key.split('-');
        const targetCircle = document.querySelector(`.location-circle[data-box="${box}"][data-well="${well}"]`);

        if (targetCircle) {
            const state = circleStates[key];

            if (state.stock && state.diluted) {
                targetCircle.classList.add('active-mixed');
            } else if (state.stock) {
                targetCircle.classList.add('active-stock');
            } else if (state.diluted) {
                targetCircle.classList.add('active-diluted');
            }

            // Scroll suave apenas para o primeiro círculo encontrado
            if (!scrolledToFirst) {
                targetCircle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                scrolledToFirst = true;
            }
        } else {
            console.warn(`highlightLocation: Círculo não encontrado para box ${box}, well ${well}.`);
        }
    }
}


async function fetchSeabassData() {
    console.log("fetchSeabassData: Tentando buscar todos os dados de Clam_Philippinarum...");
    try {
        const { data, error } = await supabase
            .from('Clam_Philippinarum')
            .select(`
                abbr,
                primer,
                forward,
                reverse,
                temperature_annealing,
                acession_number,
                product_size,
                primers_test,
                "biorad_384.slope",
                "biorad_384.efficiency",
                "biorad_384.efficiency(%)",
                "biorad_384.observations"
            `);

        if (error) {
            console.error("fetchSeabassData: ERRO ao buscar dados de Clam_Philippinarum:", error.message);
            return [];
        }

        allSeabassSamples = data;
        console.log("fetchSeabassData: Dados de Clam_Philippinarum buscados com sucesso:", allSeabassSamples);
        return data;
    } catch (error) {
        console.error("fetchSeabassData: ERRO inesperado ao buscar dados de Clam_Philippinarum:", error);
        return [];
    }
}


function populateTable(samples) {
    console.log("populateTable: Tentando popular a tabela com os dados:", samples.length);
    seabassTableBody.innerHTML = ''; // Limpa a tabela

    if (!samples || samples.length === 0) {
        seabassTableBody.innerHTML = '<tr><td colspan="2">Nenhum dado para exibir na tabela.</td></tr>';
        console.warn("populateTable: Nenhum dado para exibir na tabela.");
        return;
    }

    samples.forEach((sample, index) => {
        const row = seabassTableBody.insertRow();
        row.dataset.index = index; // Guarda o índice do sample no array
        row.innerHTML = `
            <td>${sample.abbr || 'N/A'}</td>
            <td>${sample.primer || 'N/A'}</td>
            `;
    });
}

function displayDetails(primerData) {
    console.log("displayDetails: Exibindo detalhes para:", primerData ? primerData.abbr : 'undefined');

    const detailMapping = {
        'detail-abbr': 'abbr',
        'detail-primer': 'primer',
        'detail-forward': 'forward',
        'detail-reverse': 'reverse',
        'detail-temperature-annealing': 'temperature_annealing',
        'detail-acession-number': 'acession_number',
        'detail-product-size': 'product_size',
        'detail-primers-test': 'primers_test',

        // BIORAD
        'biorad-slope': 'biorad_384.slope',
        'biorad-efficiency': 'biorad_384.efficiency',
        'biorad-efficiency-percent': 'biorad_384.efficiency(%)',
        'biorad-observattions': 'biorad_384.observations'
    };

    for (const id in detailMapping) {
        const element = document.getElementById(id);
        if (element) {
            const columnName = detailMapping[id];
            const value = primerData[columnName];
            element.textContent = (value !== undefined && value !== null) ? value : 'N/A';
        }
    }

    highlightLocation(primerData ? primerData.abbr : '');

    console.log("displayDetails: Detalhes para '" + (primerData ? primerData.abbr : 'undefined') + "' atualizados.");
}

let boxCount = 1; // valor inicial, será sobrescrito por fetchBoxCount()

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded: Página Clam_Philippinarum carregada. Iniciando setup...");

    const isConnected = await testSupabaseConnection(); 
    if (!isConnected) {
        console.error("Não foi possível conectar ao Supabase.");
        return;
    }
    
    boxCount = await fetchBoxCount(); // <- salvando valor globalmente
    initializeLocationBoxes();
    await fetchBoxLocations(); 
    allSeabassSamples = await fetchSeabassData(); 

    // Inicialmente tudo visível
    filteredSamples = allSeabassSamples;
    populateTable(filteredSamples);

    // Filtro de busca
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredSamples = allSeabassSamples.filter(sample =>
            (sample.abbr && sample.abbr.toLowerCase().includes(searchTerm)) ||
            (sample.primer && sample.primer.toLowerCase().includes(searchTerm)) ||
            (sample.forward && sample.forward.toLowerCase().includes(searchTerm)) ||
            (sample.reverse && sample.reverse.toLowerCase().includes(searchTerm))
        );
        populateTable(filteredSamples);

        // Reset da seleção
        selectedRowIndex = -1;
        displayDetails(null);
    });

    // ✅ Listener de clique na tabela (APENAS UMA VEZ AQUI)
    seabassTableBody.addEventListener('click', (event) => {
        const clickedRow = event.target.closest('tr');
        if (!clickedRow) return;

        // Remove todas as seleções anteriores
        seabassTableBody.querySelectorAll('tr').forEach(row => {
            row.classList.remove('selected-row');
        });

        // Marca a linha clicada
        clickedRow.classList.add('selected-row');

        const abbrClicked = clickedRow.cells[0].textContent.trim();
        const selectedSample = filteredSamples.find(sample => sample.abbr === abbrClicked);
        selectedRowIndex = filteredSamples.findIndex(sample => sample.abbr === abbrClicked);

        if (selectedSample) {
            displayDetails(selectedSample);
            document.getElementById('editSampleBtn').disabled = false;
            document.getElementById('deleteSampleBtn').disabled = false;
            document.getElementById('pedirAmostraBtn').disabled = false;
        }
    });
    
    // Se houver dados, mostra o primeiro automaticamente
    if (filteredSamples.length > 0) {
        selectedRowIndex = 0;
        const firstRow = seabassTableBody.querySelector(`tr[data-index="0"]`);
        if (firstRow) {
            firstRow.classList.add('selected-row');
        }
        displayDetails(filteredSamples[0]);
    } else {
        displayDetails(null);
    }

    console.log("DOMContentLoaded: Página Clam_Decussatus inicializada.");

    document.getElementById('deleteSampleBtn').addEventListener('click', async () => {
    if (selectedRowIndex === -1 || !filteredSamples[selectedRowIndex]) {
        alert("Nenhuma amostra selecionada.");
        return;
    }

    const sample = filteredSamples[selectedRowIndex];
    const confirmDelete = confirm(`Deseja mesmo excluir a amostra "${sample.abbr}"?`);

    if (!confirmDelete) return;

    // 1. Deleta da tabela Seabass
    const { error: errorSeabass } = await supabase
        .from('Clam_Philippinarum')
        .delete()
        .eq('abbr', sample.abbr);

    // 2. Deleta da tabela Seabass_BOX
    const { error: errorBox } = await supabase
        .from('Clam_BOX')
        .delete()
        .eq('abbr', sample.abbr);

    if (errorSeabass || errorBox) {
        alert("Erro ao excluir a amostra.");
        console.error("Erro ao excluir da Clam_Philippinarum:", errorSeabass);
        console.error("Erro ao excluir da Clam_BOX:", errorBox);
        return;
    }

    alert("Amostra excluída com sucesso!");

    // Atualiza a lista
    allSeabassSamples = await fetchSeabassData();
    await fetchBoxLocations();
    filteredSamples = allSeabassSamples;
    populateTable(filteredSamples);
    displayDetails(null);

    selectedRowIndex = -1;
    document.getElementById('editSampleBtn').disabled = true;
    document.getElementById('deleteSampleBtn').disabled = true;
    document.getElementById('pedirAmostraBtn').disabled = true;

});

});

document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addSampleBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            localStorage.removeItem('sampleToEdit'); // Garante que não entra no modo edição
            window.location.href = './BotãoAdicionar/add-sample.html';
        });
    }
});

document.getElementById('editSampleBtn').addEventListener('click', () => {
    if (selectedRowIndex === -1 || !filteredSamples[selectedRowIndex]) {
        alert("Nenhuma amostra selecionada.");
        return;
    }

    const sampleToEdit = filteredSamples[selectedRowIndex];
    const abbr = sampleToEdit.abbr;

    // Pegamos a localização da box para o abbr selecionado
    const boxLocations = allBoxLocations[abbr];

    let box = null;
    let boxLocation = null;

    if (boxLocations && boxLocations.length > 0) {
        box = boxLocations[0].box;
        boxLocation = boxLocations[0].well; // 'well' equivale ao campo 'box.location'
    }

    // Inclui box e box.location no objeto salvo
    const fullSample = {
        ...sampleToEdit,
        box: box,
        'box.location': boxLocation
    };

    // Salva no localStorage para a página de edição
    localStorage.setItem('sampleToEdit', JSON.stringify(fullSample));

    // Redireciona para o formulário de edição
    window.location.href = './BotãoEditar/edit-sample.html';
});

// Botão Pedir Amostra 
document.getElementById('pedirAmostraBtn').addEventListener('click', () => {
    if (selectedRowIndex === -1 || !filteredSamples[selectedRowIndex]) {
        alert("Nenhuma amostra selecionada.");
        return;
    }

    const sampleToRequest = filteredSamples[selectedRowIndex];
    const abbr = sampleToRequest.abbr;
    const primer = sampleToRequest.primer;
    const forward = sampleToRequest.forward;
    const reverse = sampleToRequest.reverse;

    // Pegamos a localização da box para o abbr selecionado
    const boxLocations = allBoxLocations[abbr];

    let box = null;
    let boxLocation = null;

    if (boxLocations && boxLocations.length > 0) {
        box = boxLocations[0].box;
        boxLocation = boxLocations[0].well;
    }

    // Inclui todos os dados necessários no objeto salvo
    const fullSample = {
        ...sampleToRequest,
        primer: primer,
        forward: forward,
        reverse: reverse,
        box: box,
        'box.location': boxLocation
    };

    console.log("🔎 Dados salvos no localStorage:", fullSample);

    localStorage.setItem('sampleToRequest', JSON.stringify(fullSample));

    // Redireciona para a página de pedido
    window.location.href = '../PedirAmostra/solicitar.html';
});

const boxModal = document.getElementById('boxModal');
const boxInput = document.getElementById('boxCountInput');
const saveBoxBtn = document.getElementById('saveBoxCountBtn');
const cancelBoxBtn = document.getElementById('cancelBoxCountBtn');

document.getElementById('editBoxCountBtn').addEventListener('click', async () => {
  // Busca o valor atual do número de caixas no Supabase
  const { data, error } = await supabase
    .from('config')
    .select('num_boxes')
    .eq('page', 'ClamPhilippinarum') // ajuste o nome da página conforme sua base
    .single();

  if (error) {
    alert("Error fetching configuration.");
    return;
  }

  boxInput.value = data?.num_boxes || 4;
  boxModal.classList.remove('hidden'); // Mostra o modal
});

saveBoxBtn.addEventListener('click', async () => {
  const newCount = parseInt(boxInput.value);
  if (isNaN(newCount) || newCount < 1) {
    alert("Please enter a valid number of boxes.");
    return;
  }

  const { error } = await supabase
    .from('config')
    .update({ num_boxes: newCount })
    .eq('page', 'ClamPhilippinarum');

  if (error) {
    alert("Error saving number of boxes.");
    return;
  }

  boxModal.classList.add('hidden');
  window.location.reload(); // Recarrega para aplicar as novas caixas
});

cancelBoxBtn.addEventListener('click', () => {
  boxModal.classList.add('hidden'); // Fecha o modal sem salvar
});

async function fetchBoxCount() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('num_boxes')
      .eq('page', 'ClamPhilippinarum') // nome da página
      .single();

    if (error || !data || !data.num_boxes || data.num_boxes < 1) {
      console.warn("Error fetching number of boxes, using 1 by default");
      return 1; // valor mínimo
    }

    return data.num_boxes;
  } catch (err) {
    console.error("Unexpected error while fetching number of boxes:", err);
    return 1;
  }
}
