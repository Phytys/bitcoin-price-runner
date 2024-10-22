document.addEventListener('DOMContentLoaded', () => {
    const leaderboardTable = document.getElementById('leaderboard-table');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const sortSelect = document.getElementById('sort-select');

    let currentPage = 1;

    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    function fetchLeaderboard() {
        const sortBy = sortSelect.value;
        const csrfToken = getCsrfToken();
        fetch(`${window.location.origin}/leaderboard?page=${currentPage}&sort_by=${sortBy}`, {
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
            .then(response => response.json())
            .then(data => {
                updateLeaderboardTable(data.entries);
                updatePagination(data.current_page, data.total_pages);
            })
            .catch(error => console.error('Error fetching leaderboard:', error));
    }

    function updateLeaderboardTable(entries) {
        const tableBody = leaderboardTable.querySelector('tbody');
        tableBody.innerHTML = '';
        entries.forEach((entry, index) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${(currentPage - 1) * 10 + index + 1}</td>
                <td>${entry.player_name}</td>
                <td>${entry.score}</td>
                <td>${entry.hodl ? 'Yes' : 'No'}</td>
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
            `;
        });
    }

    function updatePagination(currentPage, totalPages) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
    }

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchLeaderboard();
        }
    });

    nextButton.addEventListener('click', () => {
        currentPage++;
        fetchLeaderboard();
    });

    sortSelect.addEventListener('change', () => {
        currentPage = 1;
        fetchLeaderboard();
    });

    fetchLeaderboard();
});