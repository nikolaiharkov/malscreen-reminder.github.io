self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('reminder-cache').then(function(cache) {
            return cache.addAll([
                '/',
                'index.html',
                'app.js',
                'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css',
                'https://code.jquery.com/jquery-3.5.1.min.js',
                'icon.png' // Pastikan ikon ini benar-benar ada, jika tidak ada, hapus atau ganti dengan URL yang valid
            ]);
        }).catch(function(error) {
            console.error('Failed to cache resources:', error);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('sync', function(event) {
    if (event.tag === 'check-reminders') {
        event.waitUntil(checkReminders());
    }
});

function checkReminders() {
    // Implement your logic to check reminders here, similar to checkReminders in app.js
    // Fetch reminders and show notifications if the time has come
    return fetch('https://db.manhost.my.id/reminders/_design/user/_view/byUUID?include_docs=true')
        .then(response => response.json())
        .then(data => {
            const now = new Date().toISOString();
            data.rows.forEach(row => {
                const reminder = row.doc;
                if (new Date(reminder.time).toISOString() <= now) {
                    showNotification(reminder.activity);
                    deleteReminder(reminder._id, reminder._rev);
                }
            });
        });
}

function showNotification(activity) {
    self.registration.showNotification('Reminder', {
        body: activity,
        icon: 'icon.png' // Optional: Path to your icon
    });
}

function deleteReminder(id, rev) {
    // Implement the logic to delete a reminder from CouchDB
    return fetch(`https://db.manhost.my.id/reminders/${id}?rev=${rev}`, {
        method: 'DELETE'
    });
}
