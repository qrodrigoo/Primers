// script.js (da sua página principal)

document.addEventListener('DOMContentLoaded', () => {
    const btnSeabass = document.getElementById('btnSeabass');
    const btnSalmon = document.getElementById('btnSalmon');
    const btnSole = document.getElementById('btnSole');

    if (btnSeabass) {
        btnSeabass.addEventListener('click', () => {
            console.log('Botão "Seabass" clicado! Redirecionando para a página de detalhes...');
            // *** LINHA ALTERADA AQUI ***
            window.location.href = './Seabass/index.html'; // Redireciona para a nova página
        });
    }

    if (btnSalmon) {
        btnSalmon.addEventListener('click', () => {
            console.log('Botão "Salmon" clicado!');
            // Futuramente: Redirecionar para a página de Salmon
        });
    }

    if (btnSole) {
        btnSole.addEventListener('click', () => {
            console.log('Botão "Sole" clicado!');
            // Futuramente: Redirecionar para a página de Sole
        });
    }

    if (btnsample) {
        btnsample.addEventListener('click', () => {
            console.log('Botão "Ask for Sample" clicado! Redirecionando para a página de detalhes...');
            // *** LINHA ALTERADA AQUI ***
            window.location.href = './PedidosAmostra/pedido.html'; // Redireciona para a nova página
        });
    }
});