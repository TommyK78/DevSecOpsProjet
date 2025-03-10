// Utilitaires de sécurité
const security = {
    // Échapper les caractères HTML pour prévenir XSS
    escapeHtml: (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Valider les entrées
    validateInput: (input, type) => {
        const patterns = {
            name: /^[A-Za-z0-9\s\-_]{2,100}$/,
            description: /^[\w\s.,!?-]{10,1000}$/,
            price: /^\d+(\.\d{1,2})?$/
        };
        return patterns[type].test(input);
    }
};

// Gestionnaire d'API sécurisé
const api = {
    // Obtenir le token CSRF
    getCsrfToken: async () => {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        return data.csrfToken;
    },

    // Configuration par défaut pour fetch
    fetchConfig: (method, data = null) => {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.getElementById('csrf-token').dataset.token
            },
            credentials: 'same-origin'
        };
        if (data) {
            config.body = JSON.stringify(data);
        }
        return config;
    },

    // Méthodes API sécurisées
    async getItems() {
        const response = await fetch('/api/items', this.fetchConfig('GET'));
        return response.json();
    },

    async getItem(id) {
        const response = await fetch(`/api/items/${id}`, this.fetchConfig('GET'));
        return response.json();
    },

    async createItem(item) {
        const response = await fetch('/api/items', this.fetchConfig('POST', item));
        return response.json();
    },

    async updateItem(id, item) {
        const response = await fetch(`/api/items/${id}`, this.fetchConfig('PUT', item));
        return response.json();
    },

    async deleteItem(id) {
        const response = await fetch(`/api/items/${id}`, this.fetchConfig('DELETE'));
        return response.json();
    }
};

// Gestionnaire d'interface utilisateur
const ui = {
    form: document.getElementById('itemForm'),
    itemsList: document.getElementById('itemsList'),
    alertContainer: document.getElementById('alertContainer'),

    // Afficher une alerte
    showAlert: (message, type = 'success') => {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = security.escapeHtml(message);
        ui.alertContainer.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    },

    // Remplir le formulaire pour modification
    fillForm: (item) => {
        document.getElementById('itemId').value = item.id;
        document.getElementById('name').value = security.escapeHtml(item.name);
        document.getElementById('description').value = security.escapeHtml(item.description);
        document.getElementById('price').value = item.price;
    },

    // Réinitialiser le formulaire
    resetForm: () => {
        ui.form.reset();
        document.getElementById('itemId').value = '';
    },

    // Créer une ligne de tableau pour un item
    createItemRow: (item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${security.escapeHtml(item.name)}</td>
            <td>${security.escapeHtml(item.description)}</td>
            <td>${parseFloat(item.price).toFixed(2)} €</td>
            <td>
                <button class="btn btn-secondary btn-edit" data-id="${item.id}">Modifier</button>
                <button class="btn btn-danger btn-delete" data-id="${item.id}">Supprimer</button>
            </td>
        `;
        return tr;
    },

    // Mettre à jour la liste des items
    updateItemsList: async () => {
        try {
            const { data } = await api.getItems();
            ui.itemsList.innerHTML = '';
            data.forEach(item => {
                ui.itemsList.appendChild(ui.createItemRow(item));
            });
        } catch (error) {
            ui.showAlert('Erreur lors du chargement des items', 'error');
        }
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Obtenir le token CSRF
        const csrfToken = await api.getCsrfToken();
        document.getElementById('csrf-token').dataset.token = csrfToken;

        // Charger les items
        await ui.updateItemsList();

        // Gestionnaire de soumission du formulaire
        ui.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const itemData = {
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                price: parseFloat(document.getElementById('price').value)
            };

            // Validation des entrées
            if (!Object.entries(itemData).every(([key, value]) => 
                security.validateInput(value.toString(), key))) {
                ui.showAlert('Données invalides', 'error');
                return;
            }

            const itemId = document.getElementById('itemId').value;

            try {
                if (itemId) {
                    await api.updateItem(itemId, itemData);
                    ui.showAlert('Item mis à jour avec succès');
                } else {
                    await api.createItem(itemData);
                    ui.showAlert('Item créé avec succès');
                }

                ui.resetForm();
                await ui.updateItemsList();
            } catch (error) {
                ui.showAlert('Erreur lors de l\'enregistrement', 'error');
            }
        });

        // Gestionnaire de clic pour les boutons d'action
        ui.itemsList.addEventListener('click', async (e) => {
            const itemId = e.target.dataset.id;
            if (!itemId) return;

            if (e.target.classList.contains('btn-edit')) {
                try {
                    const { data } = await api.getItem(itemId);
                    ui.fillForm(data);
                } catch (error) {
                    ui.showAlert('Erreur lors du chargement de l\'item', 'error');
                }
            }

            if (e.target.classList.contains('btn-delete')) {
                if (confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
                    try {
                        await api.deleteItem(itemId);
                        ui.showAlert('Item supprimé avec succès');
                        await ui.updateItemsList();
                    } catch (error) {
                        ui.showAlert('Erreur lors de la suppression', 'error');
                    }
                }
            }
        });

    } catch (error) {
        ui.showAlert('Erreur lors de l\'initialisation', 'error');
    }
});
