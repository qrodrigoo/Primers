// AQUI: Usamos a sintaxe de importação de módulos ES6
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuração do Supabase (Substitua pelos seus dados REAIS)
const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs';

// Agora, 'createClient' é uma função importada, não uma variável global 'Supabase'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais para armazenar os dados e o estado da UI
let allSoleSamples = []; // Alterado para allSoleSamples
// allBoxLocations AGORA armazenará um ARRAY de locais para cada abbr
let allBoxLocations = {};
let selectedRowIndex = -1; // Para rastrear a linha selecionada na tabela
let filteredSamples = [];

// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const soleTableBody = document.querySelector('#seabassTable tbody'); // Alterado para soleTableBody
const allBoxesContainer = document.getElementById('allBoxesContainer');

// --- Teste de Conexão Supabase ---
async function testSupabaseConnection() {
    console.log("--- Iniciando Teste de Conexão Supabase ---");
    try {
        const { data, error } = await supabase
            .from('Sole') // Tente buscar de uma de suas tabelas principais
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

    for (let boxNum = 1; boxNum <= 2; boxNum++) {
        const boxGroup = document.createElement('div');
        boxGroup.classList.add('box-group');

        const boxTitleVertical = document.createElement('div');
        boxTitleVertical.classList.add('box-title-vertical');
        boxTitleVertical.textContent = `Caixa ${boxNum}`;
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
    console.log(`initializeLocationBoxes: ${2} caixas de localização criadas no DOM.`); // Corrigido para 2 caixas
}

async function fetchBoxLocations() {
    console.log("fetchBoxLocations: Tentando buscar localizações da caixa...");
    try {
        const { data, error } = await supabase
            .from('Sole_BOX') // Nome da tabela correto
            .select('abbr, box, "box.location"'); // Use aspas duplas para "box.location"

        if (error) {
            console.error("fetchBoxLocations: ERRO ao buscar localizações da caixa:", error.message);
            return {};
        }

        console.log("fetchBoxLocations: Dados brutos de Sole_BOX recebidos:", data);

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


async function fetchSoleData() { // Renomeado para fetchSoleData
    console.log("fetchSoleData: Tentando buscar todos os dados de Sole..."); // Ajuste da mensagem
    try {
        const { data, error } = await supabase
            .from('Sole') // Nome da tabela correto
            .select(`
                abbr,
                primer,
                forward,
                reverse,
                temperature_annealing,
                acession_number,
                product_size,
                primers_test,
                "slope",
                "efficiency(%)",
                "efficiency",
                "observations",
                "larvae.slope",
                "larvae.efficiency",
                "larvae.efficiency(%)",
                "larvae.observattions"
            `);

        if (error) {
            console.error("fetchSoleData: ERRO ao buscar dados de Sole:", error.message); // Ajuste da mensagem
            return [];
        }

        allSoleSamples = data; // Alterado para allSoleSamples
        console.log("fetchSoleData: Dados de Sole buscados com sucesso:", allSoleSamples); // Ajuste da mensagem
        return data;
    } catch (error) {
        console.error("fetchSoleData: ERRO inesperado ao buscar dados de Sole:", error); // Ajuste da mensagem
        return [];
    }
}


function populateTable(samples) {
    console.log("populateTable: Tentando popular a tabela com os dados:", samples.length);
    soleTableBody.innerHTML = ''; // Limpa a tabela, alterado para soleTableBody

    if (!samples || samples.length === 0) {
        soleTableBody.innerHTML = '<tr><td colspan="2">Nenhum dado para exibir na tabela.</td></tr>'; // soleTableBody
        console.warn("populateTable: Nenhum dado para exibir na tabela.");
        return;
    }

    samples.forEach((sample, index) => {
        const row = soleTableBody.insertRow(); // soleTableBody
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

        // SEM TITULO
        'view-slope': 'slope',
        'efficiency-percent': 'efficiency(%)',
        'view-efficiency': 'efficiency',
        'view-observations': 'observations',

        // Larvae
        'larvae-slope': 'larvae.slope',
        'larvae-efficiency': 'larvae.efficiency',
        'larvae-efficiency-percent': 'larvae.efficiency(%)',
        'larvae-observations': 'larvae.observattions'
    };

    for (const id in detailMapping) {
        const element = document.getElementById(id);
        if (element) {
            const columnName = detailMapping[id];
            // Use o operador de encadeamento opcional (?.) para evitar erro se primerData for null
            const value = primerData?.[columnName];
            element.textContent = (value !== undefined && value !== null) ? value : 'N/A';
        }
    }

    // Chama highlightLocation apenas se houver primerData
    highlightLocation(primerData ? primerData.abbr : '');

    console.log("displayDetails: Detalhes para '" + (primerData ? primerData.abbr : 'undefined') + "' atualizados.");
}



// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded: Página Sole carregada. Iniciando setup..."); // Ajuste da mensagem

    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
        console.error("Não foi possível conectar ao Supabase.");
        return;
    }

    initializeLocationBoxes();
    await fetchBoxLocations();
    allSoleSamples = await fetchSoleData(); // Chamada para a nova função e variável

    // Inicialmente tudo visível
    filteredSamples = allSoleSamples; // Alterado para allSoleSamples
    populateTable(filteredSamples);

    // Filtro de busca
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredSamples = allSoleSamples.filter(sample => // Alterado para allSoleSamples
            (sample.abbr && sample.abbr.toLowerCase().includes(searchTerm)) ||
            (sample.primer && sample.primer.toLowerCase().includes(searchTerm))
        );
        populateTable(filteredSamples);

        // Reset da seleção
        selectedRowIndex = -1;
        displayDetails(null);
    });

    // ✅ Listener de clique na tabela (APENAS UMA VEZ AQUI)
    soleTableBody.addEventListener('click', (event) => { // Alterado para soleTableBody
        const clickedRow = event.target.closest('tr');
        if (!clickedRow) return;

        if (selectedRowIndex !== -1) {
            const prev = soleTableBody.querySelector(`tr[data-index="${selectedRowIndex}"]`); // Alterado para soleTableBody
            if (prev) prev.classList.remove('selected-row');
        }

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
        const firstRow = soleTableBody.querySelector(`tr[data-index="0"]`); // Alterado para soleTableBody
        if (firstRow) {
            firstRow.classList.add('selected-row');
        }
        displayDetails(filteredSamples[0]);
    } else {
        displayDetails(null);
    }

    console.log("DOMContentLoaded: Página Sole inicializada."); // Ajuste da mensagem

    document.getElementById('deleteSampleBtn').addEventListener('click', async () => {
        if (selectedRowIndex === -1 || !filteredSamples[selectedRowIndex]) {
            alert("Nenhuma amostra selecionada.");
            return;
        }

        const sample = filteredSamples[selectedRowIndex];
        const confirmDelete = confirm(`Deseja mesmo excluir a amostra "${sample.abbr}"?`);

        if (!confirmDelete) return;

        // 1. Deleta da tabela Sole
        const { error: errorSole } = await supabase
            .from('Sole')
            .delete()
            .eq('abbr', sample.abbr);

        // 2. Deleta da tabela Sole_BOX
        const { error: errorBox } = await supabase
            .from('Sole_BOX')
            .delete()
            .eq('abbr', sample.abbr);

        if (errorSole || errorBox) {
            alert("Erro ao excluir a amostra.");
            console.error("Erro ao excluir da Sole:", errorSole);
            console.error("Erro ao excluir da Sole_BOX:", errorBox);
            return;
        }

        alert("Amostra excluída com sucesso!");

        // Atualiza a lista
        allSoleSamples = await fetchSoleData(); // Alterado para allSoleSamples e fetchSoleData
        await fetchBoxLocations();
        filteredSamples = allSoleSamples; // Alterado para allSoleSamples
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
    const primer = sampleToRequest.primer; // ou outro campo que precise

    // Pegamos a localização da box para o abbr selecionado
    const boxLocations = allBoxLocations[abbr];

    let box = null;
    let boxLocation = null;

    if (boxLocations && boxLocations.length > 0) {
        box = boxLocations[0].box;
        boxLocation = boxLocations[0].well; // 'well' equivale ao campo 'box.location'
    }

    // Inclui box e localização no objeto salvo
    const fullSample = {
        ...sampleToRequest,
        primer: primer,
        box: box,
        'box.location': boxLocation
    };

    // Salva no localStorage para a página de pedido
    localStorage.setItem('sampleToRequest', JSON.stringify(fullSample));

    // Redireciona para a página de pedido
    window.location.href = '../PedirAmostra/solicitar.html';
});