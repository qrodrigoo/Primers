import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configurações do Supabase
const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('addSampleForm');

// --- Submissão do Formulário ---
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const sampleSymbol = formData.get('symbol');

    const tilapiaData = {
        gene_group: formData.get('gene_group'),
        gene_name: formData.get('gene_name'),
        symbol: sampleSymbol,
        gene_bank: formData.get('gene_bank'),
        forward: formData.get('forward'),
        reverse: formData.get('reverse'),
        product_length: formData.get('product_length'),
        "biorad_386.annealing_temperature": formData.get('biorad_386.annealing_temperature'),
        "biorad_386.slope": formData.get('biorad_386.slope'),
        "biorad_386.efficiency": formData.get('biorad_386.efficiency'),
        "biorad_386.efficiency.porcentagem": formData.get('biorad_386.efficiency.porcentagem'),
        rt_obervations: formData.get('rt_obervations')
    };

    const tilapiaBoxData = {
        abbr: sampleSymbol,
        box: formData.get('box'),
        'box.location': formData.get('box.location')
    };

    const sampleToEdit = localStorage.getItem('sampleToEdit');
    let errorTilapia, errorTilapiaBox;

    if (sampleToEdit) {
        const original = JSON.parse(sampleToEdit);

        ({ error: errorTilapia } = await supabase
            .from('Tilapia')
            .update(tilapiaData)
            .eq('symbol', original.symbol));

        ({ error: errorTilapiaBox } = await supabase
            .from('Tilapia_BOX')
            .update(tilapiaBoxData)
            .eq('abbr', original.symbol));

        localStorage.removeItem('sampleToEdit');
    } else {
        ({ error: errorTilapia } = await supabase.from('Tilapia').insert([tilapiaData]));
        ({ error: errorTilapiaBox } = await supabase.from('Tilapia_BOX').insert([tilapiaBoxData]));
    }

    if (errorTilapia || errorTilapiaBox) {
        alert('Erro ao salvar:\n' +
            (errorTilapia?.message || '') + '\n' +
            (errorTilapiaBox?.message || ''));
    } else {
        alert(sampleToEdit ? 'Amostra editada com sucesso!' : 'Amostra adicionada com sucesso!');
        form.reset();
        window.location.href = '../tilapia-index.html';
    }
});

// --- Preencher Formulário no Modo Edição ---
document.addEventListener('DOMContentLoaded', () => {
    const existingSample = localStorage.getItem('sampleToEdit');

    if (existingSample) {
        const sampleData = JSON.parse(existingSample);

        const fieldsToMap = [
            'gene_group', 'gene_name', 'symbol', 'gene_bank', 'forward', 'reverse', 'product_length',
            'biorad_386.annealing_temperature', 'biorad_386.slope', 'biorad_386.efficiency',
            'biorad_386.efficiency.porcentagem', 'rt_obervations', 'box', 'box.location'
        ];

        fieldsToMap.forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                let value;

                if (key === 'symbol') {
                    value = sampleData.symbol || sampleData.abbr;
                } else {
                    value = sampleData[key]; // <<< AQUI: pega como campo literal, mesmo com ponto
                }

                if (value !== undefined && value !== null) {
                    input.value = value;
                }
            }
        });

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.textContent = 'Save Changes';
    }
});
