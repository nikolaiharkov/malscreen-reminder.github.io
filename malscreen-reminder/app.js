$(document).ready(function () {
    const couchDBURL = 'https://db.manhost.my.id/reminders';
    const username = 'admin'; // Ganti dengan username CouchDB Anda
    const password = 'H@rk0vnet'; // Ganti dengan password CouchDB Anda
    const auth = "Basic " + btoa(username + ":" + password);

    $('#reminderForm').on('submit', function (event) {
        event.preventDefault();
        const activity = $('#activity').val();
        const date = $('#date').val();
        const time = $('#time').val();

        const reminder = {
            activity: activity,
            time: convertToUTC7(date, time),
            userUUID: getUserUUID()
        };

        addReminder(reminder);
    });

    function addReminder(reminder) {
        $.ajax({
            url: couchDBURL,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reminder),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", auth);
            },
            success: function () {
                console.log('Reminder added successfully');
                fetchReminders();
            },
            error: function (error) {
                console.error('Error adding reminder:', error);
            }
        });
    }

    function fetchReminders() {
        const userUUID = getUserUUID();
        $.ajax({
            url: `${couchDBURL}/_design/user/_view/byUUID?key="${userUUID}"&include_docs=true`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", auth);
            },
            success: function (response) {
                $('#reminderList').empty();
                response.rows.forEach(row => {
                    const reminder = row.doc;
                    const listItem = `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${reminder.activity} - ${new Date(reminder.time).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' })}
                            <button class="btn btn-delete" onclick="deleteReminder('${reminder._id}', '${reminder._rev}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </li>`;
                    $('#reminderList').append(listItem);
                });
            },
            error: function (error) {
                console.error('Error fetching reminders:', error);
            }
        });
    }

    window.deleteReminder = function(id, rev) {
        $.ajax({
            url: `${couchDBURL}/${id}?rev=${rev}`,
            type: 'DELETE',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", auth);
            },
            success: function () {
                console.log('Reminder deleted successfully');
                fetchReminders();
            },
            error: function (error) {
                console.error('Error deleting reminder:', error);
            }
        });
    }

    function checkReminders() {
        const userUUID = getUserUUID();
        $.ajax({
            url: `${couchDBURL}/_design/user/_view/byUUID?key="${userUUID}"&include_docs=true`,
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", auth);
            },
            success: function (response) {
                const now = new Date().toISOString();
                response.rows.forEach(row => {
                    const reminder = row.doc;
                    if (new Date(reminder.time).toISOString() <= now) {
                        showNotification(reminder.activity);
                        // Optional: Delete the reminder after showing the notification
                        deleteReminder(reminder._id, reminder._rev);
                    }
                });
            },
            error: function (error) {
                console.error('Error checking reminders:', error);
            }
        });
    }

    function showNotification(activity) {
        if (Notification.permission === 'granted') {
            new Notification('Reminder', {
                body: activity,
                icon: 'icon.png' // optional
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Reminder', {
                        body: activity,
                        icon: 'icon.png' // optional
                    });
                }
            });
        }
    }

    // Check reminders every minute
    setInterval(checkReminders, 60000);

    // Request notification permission on page load
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getUserUUID() {
        let userUUID = localStorage.getItem('userUUID');
        if (!userUUID) {
            userUUID = generateUUID();
            localStorage.setItem('userUUID', userUUID);
        }
        return userUUID;
    }

    function convertToUTC7(date, time) {
        const dateTime = new Date(`${date}T${time}:00`);
        const utc7Time = new Date(dateTime.getTime() - (7 * 60 * 60 * 1000));
        return utc7Time.toISOString();
    }

    // Fetch reminders on page load
    fetchReminders();
});
