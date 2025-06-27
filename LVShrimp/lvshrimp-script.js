// AQUI: Usamos a sintaxe de importação de módulos ES6
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuração do Supabase (Substitua pelos seus dados REAIS)
const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co'; 
// !!! IMPORTANTE: SUBSTITUA ESTA CHAVE POR UMA NOVA E VÁLIDA DO SEU SUPABASE !!!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs'; // <<< SUBSTITUA ESTA LINHA COM A CHAVE ATUALIZADA

// Agora, 'createClient' é uma função importada, não uma variável global 'Supabase'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
// Variáveis globais para armazenar os dados e o estado da UI
let allTilapiaSamples = []; 
let allBoxLocations = {}; 
let selectedRowIndex = -1; // Para rastrear a linha selecionada na tabela
let filteredSamples = [];

// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const tilapiaTableBody = document.querySelector('#seabassTable tbody'); 
const allBoxesContainer = document.getElementById('allBoxesContainer');

// --- Teste de Conexão Supabase ---
async function testSupabaseConnection() {
    console.log("--- Iniciando Teste de Conexão Supabase ---");
    try {
        const { data, error } = await supabase
            .from('LVShrimp') 
            .select('symbol') 
            .limit(1);

        if (error) {
            console.error("ERRO na CONEXÃO Supabase:", error.message);
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
    allBoxesContainer.innerHTML = ''; 
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
                const rowChar = String.fromCharCode(65 + row); 
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
            .from('LVShrimp_BOX') 
            .select('abbr, box, "box.location"'); 

        if (error) {
            console.error("fetchBoxLocations: ERRO ao buscar localizações da caixa:", error.message);
            return {}; 
        }

        console.log("fetchBoxLocations: Dados brutos de LVShrimp_BOX recebidos:", data);

        const mappedLocations = {};
        data.forEach(item => {
            if (item.abbr && item.box && item['box.location']) {
                if (!mappedLocations[item.abbr]) {
                    mappedLocations[item.abbr] = [];
                }
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

    document.querySelectorAll('.location-circle.active-stock, .location-circle.active-diluted, .location-circle.active-mixed')
        .forEach(circle => {
            circle.classList.remove('active-stock', 'active-diluted', 'active-mixed');
        });

    if (!abbr || !allBoxLocations[abbr] || allBoxLocations[abbr].length === 0) {
        console.warn(`highlightLocation: Nenhuma localização encontrada para '${abbr}'.`);
        return;
    }

    const locations = allBoxLocations[abbr];

    const circleStates = {}; 

    locations.forEach(location => {
        const key = `${location.box}-${location.well}`;
        const rowLetter = location.well.charAt(0).toUpperCase();
        let type = 'stock'; 

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

            if (!scrolledToFirst) {
                targetCircle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                scrolledToFirst = true;
            }
        } else {
            console.warn(`highlightLocation: Círculo não encontrado para box ${box}, well ${well}.`);
        }
    }
}


async function fetchTilapiaData() { 
    console.log("fetchTilapiaData: Tentando buscar todos os dados de Tilapia...");
    try {
        const { data, error } = await supabase
            .from('LVShrimp') 
            .select(`
                id,
                gene_group,
                gene_name,
                symbol,
                gene_bank,
                forward,
                reverse,
                product_length,
                "biorad.annealing_temperature",
                "biorad.slope",
                "biorad.efficiency",
                "biorad.efficiency.porcentagem",
                "biorad.obervations"`);

        if (error) {
            console.error("fetchTilapiaData: ERRO ao buscar dados de Tilapia:", error.message);
            return [];
        }

        allTilapiaSamples = data; 
        console.log("fetchTilapiaData: Dados de Tilapia buscados com sucesso:", allTilapiaSamples);
        return data;
    } catch (error) {
        console.error("fetchTilapiaData: ERRO inesperado ao buscar dados de Tilapia:", error);
        return [];
    }
}


function populateTable(samples) {
    console.log("populateTable: Tentando popular a tabela com os dados:", samples.length);
    tilapiaTableBody.innerHTML = '';

    if (!samples || samples.length === 0) {
        tilapiaTableBody.innerHTML = '<tr><td colspan="2">Nenhum dado para exibir na tabela.</td></tr>';
        console.warn("populateTable: Nenhum dado para exibir na tabela.");
        return;
    }

    samples.forEach((sample, index) => {
        const row = tilapiaTableBody.insertRow();
        row.dataset.index = index;
        row.innerHTML = `
            <td>${sample.symbol || 'N/A'}</td>
            <td>${sample.gene_name || 'N/A'}</td>
        `;
    });
}


function displayDetails(primerData) {
    console.log("displayDetails: Exibindo detalhes para:", primerData ? primerData.symbol : 'undefined');

    const detailMapping = {
        'detail-abbr': 'symbol',                                
        'detail-primer': 'gene_name',                          
        'detail-forward': 'forward',
        'detail-reverse': 'reverse',
        'detail-acession-number': 'gene_bank',                  
        'detail-product-size': 'product_length',                
        'detail-gene-group': 'gene_group',

        'biorad_386.slope': 'biorad.slope', // ID HTML agora corresponde ao caminho
        'biorad_386.efficiency': 'biorad.efficiency',
        'biorad_386.efficiency.porcentagem': 'biorad.efficiency.porcentagem',
        'biorad_386.annealing_temperature': 'biorad.annealing_temperature', 
        'biorad-observations': 'biorad.obervations'
    };

    for (const id in detailMapping) {
        const element = document.getElementById(id);
        if (element) {
            const columnName = detailMapping[id];
            // Para acessar nested JSON (objeto dentro de objeto)
            let value = 'N/A';
            if (primerData && columnName) {
                // ALTERAÇÃO CRÍTICA AQUI: Remova o `replace` para manter a notação de ponto
                // e acesse diretamente usando notação de colchetes.
                // Como Supabase já retorna com a notação de ponto, podemos acessar diretamente.
                value = primerData[columnName];

                // Adicionalmente, caso haja aninhamento de verdade (objeto dentro de objeto),
                // o seu código original tratava isso, mas precisa ser revisado para não remover os pontos.
                // No entanto, para os campos biorad_386, o Supabase já os retorna "achatados" com o ponto no nome da chave.
                // Então, a linha acima 'value = primerData[columnName];' já deve ser suficiente.
                // Se 'biorad_386' fosse um objeto dentro de primerData, e depois 'slope' uma propriedade desse objeto,
                // a lógica seria mais complexa, mas não é o caso com o Supabase ao usar "nome_da_tabela.nome_da_coluna".
            }
            element.textContent = value !== undefined && value !== null ? value : 'N/A';
        }
    }

    highlightLocation(primerData ? primerData.symbol : ''); 

    console.log("displayDetails: Detalhes para '" + (primerData ? primerData.symbol : 'undefined') + "' atualizados.");
}

let boxCount = 1; // valor inicial, será sobrescrito por fetchBoxCount()

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded: Página Tilapia carregada. Iniciando setup...");

    const isConnected = await testSupabaseConnection(); 
    if (!isConnected) {
        console.error("Não foi possível conectar ao Supabase.");
        return;
    }
    boxCount = await fetchBoxCount(); // <- salvando valor globalmente

    initializeLocationBoxes();
    await fetchBoxLocations(); 
    allTilapiaSamples = await fetchTilapiaData(); 

    // Inicialmente tudo visível
    filteredSamples = allTilapiaSamples; 
    populateTable(filteredSamples);

    // Filtro de busca
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredSamples = allTilapiaSamples.filter(sample => 
            (sample.symbol && sample.symbol.toLowerCase().includes(searchTerm)) || 
            (sample.gene_name && sample.gene_name.toLowerCase().includes(searchTerm))||
            (sample.forward && sample.forward.toLowerCase().includes(searchTerm)) ||
            (sample.reverse && sample.reverse.toLowerCase().includes(searchTerm))
        );
        populateTable(filteredSamples);

        // Reset da seleção
        selectedRowIndex = -1;
        displayDetails(null);
    });

    // Listener de clique na tabela
    tilapiaTableBody.addEventListener('click', (event) => { 
        const clickedRow = event.target.closest('tr');
        if (!clickedRow) return;

        if (selectedRowIndex !== -1) {
            const prev = tilapiaTableBody.querySelector(`tr[data-index="${selectedRowIndex}"]`); 
            if (prev) prev.classList.remove('selected-row');
        }

        clickedRow.classList.add('selected-row');
        const symbolClicked = clickedRow.cells[0].textContent.trim(); 
        const selectedSample = filteredSamples.find(sample => sample.symbol === symbolClicked); 
        selectedRowIndex = filteredSamples.findIndex(sample => sample.symbol === symbolClicked); 

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
        const firstRow = tilapiaTableBody.querySelector(`tr[data-index="0"]`); 
        if (firstRow) {
            firstRow.classList.add('selected-row');
        }
        displayDetails(filteredSamples[0]);
    } else {
        displayDetails(null);
    }

    console.log("DOMContentLoaded: Página Tilapia inicializada.");

    document.getElementById('deleteSampleBtn').addEventListener('click', async () => {
    if (selectedRowIndex === -1 || !filteredSamples[selectedRowIndex]) {
        alert("Nenhuma amostra selecionada.");
        return;
    }

    const sample = filteredSamples[selectedRowIndex];
    const confirmDelete = confirm(`Deseja mesmo excluir a amostra "${sample.symbol}"?`); 

    if (!confirmDelete) return;

    // 1. Deleta da tabela Tilapia
    const { error: errorTilapia } = await supabase
        .from('LVShrimp') 
        .delete()
        .eq('symbol', sample.symbol); 

    // 2. Deleta da tabela Tilapia_BOX
    const { error: errorBox } = await supabase
        .from('LVShrimp_BOX') 
        .delete()
        .eq('abbr', sample.symbol); 

    if (errorTilapia || errorBox) {
        alert("Erro ao excluir a amostra.");
        console.error("Erro ao excluir da LVShrimp:", errorTilapia);
        console.error("Erro ao excluir da LVShrimp_BOX:", errorBox);
        return;
    }

    alert("Amostra excluída com sucesso!");

    // Atualiza a lista
    allTilapiaSamples = await fetchTilapiaData(); 
    await fetchBoxLocations();
    filteredSamples = allTilapiaSamples; 
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
            localStorage.removeItem('sampleToEdit'); 
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
    const symbol = sampleToEdit.symbol; 

    const boxLocations = allBoxLocations[symbol]; 

    let box = null;
    let boxLocation = null;

    if (boxLocations && boxLocations.length > 0) {
        box = boxLocations[0].box;
        boxLocation = boxLocations[0].well; 
    }

    const fullSample = {
        ...sampleToEdit,
        box: box,
        'box.location': boxLocation
    };

    localStorage.setItem('sampleToEdit', JSON.stringify(fullSample));

    window.location.href = './BotãoEditar/edit-sample.html';
});

// Botão Pedir Amostra 
document.getElementById('pedirAmostraBtn').addEventListener('click', () => {
    if (selectedRowIndex === -1 || !filteredSamples[selectedRowIndex]) {
        alert("Nenhuma amostra selecionada.");
        return;
    }

    const sample = filteredSamples[selectedRowIndex];

    const name = sample.abbr || sample.symbol || '';
    const primer = sample.primer || sample.gene_name || '';
    const forward = sample.forward;
    const reverse = sample.reverse;

    // Determina F/R pela última "palavra" (última parte após espaço)
    const lastChar = name.trim().split(' ').pop().toUpperCase();

    let sequenceValue = primer;
    if (lastChar === 'F' && forward) {
        sequenceValue = forward;
    } else if (lastChar === 'R' && reverse) {
        sequenceValue = reverse;
    }

    // Pegamos a localização da box para o abbr ou symbol
    const boxLocations = allBoxLocations[name];

    let box = null;
    let boxLocation = null;
    if (boxLocations && boxLocations.length > 0) {
        box = boxLocations[0].box;
        boxLocation = boxLocations[0].well;
    }

    const fullSample = {
        ...sample,
        abbr: sample.abbr || '',
        symbol: sample.symbol || '',
        primer: sequenceValue, // Aqui já está com forward/reverse aplicado
        box: box,
        'box.location': boxLocation
    };

    localStorage.setItem('sampleToRequest', JSON.stringify(fullSample));
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
    .eq('page', 'LVShrimp') // ajuste o nome da página conforme sua base
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
    .eq('page', 'LVShrimp');

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
      .eq('page', 'LVShrimp') // nome da página
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
