async function searchContact() {
    const query = document.getElementById('searchInput').value.trim();
    const resultBox = document.getElementById('searchResult');
    resultBox.innerHTML = '';

    if (!query) {
        resultBox.innerHTML = '<p>Por favor, ingresa un número o correo.</p>';
        return;
    }

    try {
        const res = await fetch(`/api/contacts/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (res.ok && data.contact) {
            const { name, email, phone } = data.contact;
            resultBox.innerHTML = `
                <div class="contact-card">
                    <p><strong>Nombre:</strong> ${name}</p>
                    <p><strong>Correo:</strong> ${email}</p>
                    <p><strong>Celular:</strong> ${phone}</p>
                </div>
            `;
        } else {
            resultBox.innerHTML = `<p>No se encontró ningún contacto con ese dato.</p>`;
        }
    } catch (error) {
        resultBox.innerHTML = `<p>Error al buscar el contacto.</p>`;
        console.error(error);
    }
}
