// script-add-sample.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://zjinpbpnjebldikhwofh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaW5wYnBuamVibGRpa2h3b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzQ3MjMsImV4cCI6MjA2NTIxMDcyM30.fkp-NHgFyZ6KKUjkLgshE90--5NJIi5dlx2_E2PzOFs'; // Substitua pela sua chave real
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('addSampleForm');
const dynamicSectionsContainer = document.getElementById('extraSectionsContainer');
const addSectionBtn = document.getElementById('addSectionBtn');


form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const abbr = formData.get('abbr');
    const box = formData.get('box');
    const boxLocation = formData.get('box.location');

    const baseData = {
        abbr,
        primer: formData.get('primer'),
        forward: formData.get('forward'),
        reverse: formData.get('reverse'),
        temperature_annealing: formData.get('temperature_annealing'),
        acession_number: formData.get('acession_number'),
        product_size: formData.get('product_size'),
        primers_test: formData.get('primers_test')
    };

    const sections = formData.getAll('section-name[]');
    const slopes = formData.getAll('section-slope[]');
    const efficiencies = formData.getAll('section-efficiency[]');
    const efficiencyPercents = formData.getAll('section-efficiency-percent[]');
    const observations = formData.getAll('section-observations[]');

    sections.forEach((sectionName, index) => {
        const safeKey = sectionName.toLowerCase().replace(/\s+/g, '-');
        baseData[`${safeKey}.slope`] = slopes[index];
        baseData[`${safeKey}.efficiency`] = efficiencies[index];
        baseData[`${safeKey}.efficiency(%)`] = efficiencyPercents[index];
        baseData[`${safeKey}.observations`] = observations[index];
    });

    const sampleToEdit = localStorage.getItem('sampleToEdit');
    let errorSeabass, errorBox;

    if (sampleToEdit) {
        // MODO EDIÇÃO
        const original = JSON.parse(sampleToEdit);

        ({ error: errorSeabass } = await supabase
            .from('Seabass')
            .update(baseData)
            .eq('abbr', original.abbr));

        ({ error: errorBox } = await supabase
            .from('Seabass_BOX')
            .update({ abbr, box, 'box.location': boxLocation })
            .eq('abbr', original.abbr));

        localStorage.removeItem('sampleToEdit');
    } else {
        // MODO ADIÇÃO
        ({ error: errorSeabass } = await supabase.from('Seabass').insert([baseData]));

        ({ error: errorBox } = await supabase.from('Seabass_BOX').insert([
            { abbr, box, 'box.location': boxLocation }
        ]));
    }

    if (errorSeabass || errorBox) {
        alert('Erro ao salvar:\n' +
            (errorSeabass?.message || '') + '\n' +
            (errorBox?.message || ''));
        console.error('Erro Seabass:', errorSeabass);
        console.error('Erro Seabass_BOX:', errorBox);
    } else {
        alert(sampleToEdit ? 'Amostra editada com sucesso!' : 'Amostra adicionada com sucesso!');
        form.reset();
        dynamicSectionsContainer.innerHTML = '';
        window.location.href = '../index.html';
    }
});



document.getElementById("addSectionBtn").addEventListener("click", () => {
    const sectionName = prompt("Digite o nome da nova seção:");

    if (!sectionName) return;

    const formattedId = sectionName.toLowerCase().replace(/\s+/g, '-');

    const sectionHTML = `
        <div class="section custom-section">
            <hr>
            <div class="section-header">
                <h4>${sectionName}</h4>
                <button class="remove-section-btn" type="button">❌ Remover</button>
            </div>
            <div class="form-grid">
                <div class="form-item">
                    <label for="${formattedId}-slope">Slope</label>
                    <input type="text" id="${formattedId}-slope" name="${sectionName}.slope">
                </div>
                <div class="form-item">
                    <label for="${formattedId}-efficiency">Efficiency</label>
                    <input type="text" id="${formattedId}-efficiency" name="${sectionName}.efficiency">
                </div>
                <div class="form-item">
                    <label for="${formattedId}-efficiency-percent">Efficiency (%)</label>
                    <input type="text" id="${formattedId}-efficiency-percent" name="${sectionName}.efficiency(%)">
                </div>
                <div class="form-item">
                    <label for="${formattedId}-observations">Observations</label>
                    <input type="text" id="${formattedId}-observations" name="${sectionName}.observations">
                </div>
            </div>
        </div>
    `;

    const container = document.getElementById("extraSectionsContainer");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sectionHTML;

    // Adiciona o evento ao botão de remover
    const removeBtn = wrapper.querySelector(".remove-section-btn");
    removeBtn.addEventListener("click", () => {
        wrapper.remove();
    });

    container.appendChild(wrapper);
});

document.addEventListener('DOMContentLoaded', () => {
    const existingSample = localStorage.getItem('sampleToEdit');

    if (existingSample) {
        const sampleData = JSON.parse(existingSample);

        // Preenche os campos do formulário com os dados da amostra
        for (const key in sampleData) {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = sampleData[key];
            }
        }

        // Altere o texto do botão se quiser indicar modo edição
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.textContent = 'Salvar Edição';
    }
});

function handleAddSample() {
    localStorage.removeItem('sampleToEdit'); // Limpa o item de edição
    window.location.href = './Botão Adicionar/add-sample.html'; // Redireciona
}
