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
    const boxLocation = formData.get('box.location');

    // Campos da tabela Seabass (exceto box)
    const baseData = {
        abbr,
        primer: formData.get('primer'),
        forward: formData.get('forward'),
        reverse: formData.get('reverse'),
        temperature_annealing: formData.get('temperature_annealing'),
        acession_number: formData.get('acession_number'),
        product_size: formData.get('product_size'),
        primers_test: formData.get('primers_test'),
    };

    // Preencher dados das seções (estáticos e dinâmicos)
    formData.forEach((value, key) => {
        if (
            key.includes('.') &&
            !['box.location'].includes(key) // evita incluir box.location na tabela errada
        ) {
            baseData[key] = value;
        }
    });

    const sampleToEdit = localStorage.getItem('sampleToEdit');
    let errorSeabass, errorBox;

    if (sampleToEdit) {
        // MODO EDIÇÃO
        const original = JSON.parse(sampleToEdit);

        ({ error: errorSeabass } = await supabase
            .from('Clam_Philippinarum')
            .update(baseData)
            .eq('abbr', original.abbr));

        ({ error: errorBox } = await supabase
            .from('Clam_BOX')
            .update({ abbr, box, 'box.location': boxLocation })
            .eq('abbr', original.abbr));

        localStorage.removeItem('sampleToEdit');
    } else {
        // MODO ADIÇÃO
        ({ error: errorSeabass } = await supabase.from('Clam_Philippinarum').insert([baseData]));

        ({ error: errorBox } = await supabase.from('Clam_BOX').insert([
            { abbr, box, 'box.location': boxLocation }
        ]));
    }

    // Verificação final
    if (errorSeabass || errorBox) {
        alert('Erro ao salvar:\n' +
            (errorSeabass?.message || '') + '\n' +
            (errorBox?.message || ''));
        console.error('Erro Clam_Philippinarum:', errorSeabass);
        console.error('Erro Clam_BOX:', errorBox);
    } else {
        alert(sampleToEdit ? 'Amostra editada com sucesso!' : 'Amostra adicionada com sucesso!');
        form.reset();
        dynamicSectionsContainer.innerHTML = '';
        window.location.href = '../clam-philippinarum-index.html';
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
        if (saveBtn) saveBtn.textContent = 'Save Edit';
    }
});

function handleAddSample() {
    localStorage.removeItem('sampleToEdit');
    window.location.href = './Botão Adicionar/add-sample.html';
}
