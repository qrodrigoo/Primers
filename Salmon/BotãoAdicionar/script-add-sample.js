import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs'; // sua chave
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('addSampleForm');
const dynamicSectionsContainer = document.getElementById('extraSectionsContainer');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    // Dados principais
    const abbr = formData.get('abbr');
    const box = formData.get('box');
    const boxLocation = formData.get('box.location'); // Assumindo que 'box.location' vem do formulário

    // Campos da tabela Salmon (todas as colunas, exceto as da Salmon_BOX que são tratadas separadamente)
    const baseData = {
        abbr,
        primer: formData.get('primer'),
        forward: formData.get('forward'),
        reverse: formData.get('reverse'),
        temperature_annealing: formData.get('temperature_annealing'),
        acession_number: formData.get('acession_number'),
        product_size: formData.get('product_size'),
        primers_test: formData.get('primers_test'),
        // Novas colunas da tabela Salmon
        "head-kidney.slope" : formData.get('head-kidney.slope'),
        "head-kidney.temperature_annealing": formData.get('head-kidney.temperature_annealing'),
        "head-kidney.efficiency": formData.get('head-kidney.efficiency'),
        "head-kidney.efficiency(%)": formData.get('head-kidney.efficiency(%)'),
        "head-kidney.observations": formData.get('head-kidney.observations'),
        "head-kidney.biorad.slope": formData.get('head-kidney.biorad.slope'),
        "head-kidney.biorad.efficiency": formData.get('head-kidney.biorad.efficiency'),
        "head-kidney.biorad.efficiency(%)": formData.get('head-kidney.biorad.efficiency(%)'),
        "head-kidney.biorad.observattions": formData.get('head-kidney.biorad.observattions')
    };

    // Filtra campos nulos ou vazios para não tentar inserir 'null' em colunas não nulas, se aplicável
    // E garante que apenas as colunas válidas para 'Salmon' sejam incluídas
    const filteredBaseData = {};
    for (const key in baseData) {
        if (baseData[key] !== null && baseData[key] !== undefined && baseData[key] !== '') {
            filteredBaseData[key] = baseData[key];
        }
    }

    const sampleToEdit = localStorage.getItem('sampleToEdit');
    let errorSalmon, errorBox;

    if (sampleToEdit) {
        // MODO EDIÇÃO
        const original = JSON.parse(sampleToEdit);

        // Atualiza a tabela Salmon
        ({ error: errorSalmon } = await supabase
            .from('Salmon') // Mantido como Salmon
            .update(filteredBaseData) // Usa os dados filtrados
            .eq('abbr', original.abbr));

        // Atualiza a tabela Salmon_BOX
        ({ error: errorBox } = await supabase
            .from('Salmon_BOX') // <<< CORRIGIDO PARA Salmon_BOX
            .update({ abbr, box, 'box.location': boxLocation })
            .eq('abbr', original.abbr));
    } else {
        // MODO ADIÇÃO
        // Insere na tabela Salmon
        ({ error: errorSalmon } = await supabase.from('Salmon').insert([filteredBaseData])); // Mantido como Salmon

        // Insere na tabela Salmon_BOX
        ({ error: errorBox } = await supabase.from('Salmon_BOX').insert([ // <<< CORRIGIDO PARA Salmon_BOX
            { abbr, box, 'box.location': boxLocation }
        ]));
    }

    // Verificação final
    if (errorSalmon || errorBox) {
        alert('Erro ao salvar:\n' +
            (errorSalmon?.message || '') + '\n' +
            (errorBox?.message || ''));
        console.error('Erro Salmon:', errorSalmon);
        console.error('Erro Salmon_BOX:', errorBox); // <<< CORRIGIDO PARA Salmon_BOX
    } else {
        alert(sampleToEdit ? 'Amostra editada com sucesso!' : 'Amostra adicionada com sucesso!');
        form.reset();
        dynamicSectionsContainer.innerHTML = '';
        window.location.href = '../salmon-index.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const existingSample = localStorage.getItem('sampleToEdit');

    if (existingSample) {
        const sampleData = JSON.parse(existingSample);

        for (const key in sampleData) {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) input.value = sampleData[key];
        }

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.textContent = 'Salvar Edição';
    }
});

function handleAddSample() {
    localStorage.removeItem('sampleToEdit');
    window.location.href = './Botão Adicionar/add-sample.html';
}