import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs'; // sua chave
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('addSampleForm');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    // --- DEPURANDO: Veja o valor do input 'symbol' ---
    const sampleSymbol = formData.get('symbol');
    console.log('Valor coletado do campo "Símbolo":', sampleSymbol); // Log 1

    // Dados para a tabela Tilapia
    const tilapiaData = {
        gene_group: formData.get('gene_group'),
        gene_name: formData.get('gene_name'),
        symbol: sampleSymbol, // 'symbol' na tabela Tilapia
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
    console.log('tilapiaData a ser enviado:', tilapiaData); // Log 2

    // Dados para a tabela Tilapia_BOX
    const tilapiaBoxData = {
        abbr: sampleSymbol, // 'abbr' na Tilapia_BOX recebe o valor do input 'symbol'
        box: formData.get('box'),
        'box.location': formData.get('box.location')
    };
    console.log('tilapiaBoxData a ser enviado:', tilapiaBoxData); // Log 3

    const sampleToEdit = localStorage.getItem('sampleToEdit');
    let errorTilapia, errorTilapiaBox;

    if (sampleToEdit) {
        // MODO EDIÇÃO
        const original = JSON.parse(sampleToEdit);
        console.log('Modo Edição - Amostra Original:', original); // Log 4

        // Atualiza Tilapia
        ({ error: errorTilapia } = await supabase
            .from('Tilapia')
            .update(tilapiaData)
            .eq('symbol', original.symbol));
        console.log('Resultado Update Tilapia:', errorTilapia); // Log 5

        // Atualiza Tilapia_BOX
        ({ error: errorTilapiaBox } = await supabase
            .from('Tilapia_BOX')
            .update(tilapiaBoxData)
            .eq('abbr', original.symbol)); // Busca pela coluna 'abbr' na Tilapia_BOX usando o 'symbol' original
        console.log('Resultado Update Tilapia_BOX:', errorTilapiaBox); // Log 6

        localStorage.removeItem('sampleToEdit');
    } else {
        // MODO ADIÇÃO
        ({ error: errorTilapia } = await supabase.from('Tilapia').insert([tilapiaData]));
        console.log('Resultado Insert Tilapia:', errorTilapia); // Log 7

        ({ error: errorTilapiaBox } = await supabase.from('Tilapia_BOX').insert([tilapiaBoxData]));
        console.log('Resultado Insert Tilapia_BOX:', errorTilapiaBox); // Log 8
    }

    // Verificação final
    if (errorTilapia || errorTilapiaBox) {
        alert('Erro ao salvar:\n' +
            (errorTilapia?.message || '') + '\n' +
            (errorTilapiaBox?.message || ''));
        console.error('Erro Tilapia Final:', errorTilapia);
        console.error('Erro Tilapia_BOX Final:', errorTilapiaBox);
    } else {
        alert(sampleToEdit ? 'Amostra editada com sucesso!' : 'Amostra adicionada com sucesso!');
        form.reset();
        window.location.href = '../tilapia-index.html';
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const existingSample = localStorage.getItem('sampleToEdit');

    if (existingSample) {
        const sampleData = JSON.parse(existingSample);
        console.log("Modo Edição: Carregando dados da amostra (sampleData):", sampleData); // Log 9

        // ... (restante do seu código DOMContentLoaded para preencher os campos)
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
                    value = sampleData.symbol || sampleData.abbr; // Prioriza 'symbol', mas usa 'abbr' se 'symbol' não existir
                } 
                else if (key.includes('.')) {
                    let nestedValue = sampleData;
                    const parts = key.split('.');
                    for(let i = 0; i < parts.length; i++) {
                        const part = parts[i];
                        if (nestedValue && typeof nestedValue === 'object' && part in nestedValue) {
                            nestedValue = nestedValue[part];
                        } else {
                            nestedValue = undefined;
                            break;
                        }
                    }
                    value = nestedValue;
                }
                else {
                    value = sampleData[key];
                }

                if (value !== undefined && value !== null) {
                    input.value = value;
                }
            }
        });

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.textContent = 'Salvar Edição';
    }
});