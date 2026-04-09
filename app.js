const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1491631332936253530/wHXUuVlzPQF40J7XYocfwp58LMdVFA4g4RqPJk4Kcr2S_OiaksvTOWVaoevB4fNjewC0';

let _supabase;

async function init() {
    if (typeof supabase === 'undefined') {
        setTimeout(init, 500);
        return;
    }
    _supabase = supabase.createClient(SB_URL, SB_KEY);
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = !!session;
    if (isAdmin) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('admin-tools').style.display = 'flex';
        document.getElementById('user-email').innerText = session.user.email + " | ";
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'table-cell');
    }
    fetchMembers(isAdmin);
}

async function fetchMembers(isAdmin) {
    const list = document.getElementById('member-list');
    const { data, error } = await _supabase.from('boss_hits').select('*').order('member_name', { ascending: true });
    if (error) {
        list.innerHTML = '<tr><td colspan="5">Error: ' + error.message + '</td></tr>';
        return;
    }
    list.innerHTML = '';
    data.forEach(m => {
        const row = document.createElement('tr');
        const nameDisplay = isAdmin ? '<input type="text" class="edit-name-input" value="' + m.member_name + '" onchange="updateMemberName(' + m.id + ', this.value)">' : '<span>' + m.member_name + '</span>';
        row.innerHTML = '<td>' + nameDisplay + '</td>' +
            '<td><input type="checkbox" ' + (m.hit_1 ? 'checked' : '') + ' ' + (!isAdmin ? 'disabled' : '') + ' onchange="updateHit(' + m.id + ', \'hit_1\', this.checked)"></td>' +
            '<td><input type="checkbox" ' + (m.hit_2 ? 'checked' : '') + ' ' + (!isAdmin ? 'disabled' : '') + ' onchange="updateHit(' + m.id + ', \'hit_2\', this.checked)"></td>' +
            '<td><input type="checkbox" ' + (m.hit_3 ? 'checked' : '') + ' ' + (!isAdmin ? 'disabled' : '') + ' onchange="updateHit(' + m.id + ', \'hit_3\', this.checked)"></td>' +
            (isAdmin ? '<td><button class="btn danger" onclick="delMember(' + m.id + ')">Remove</button></td>' : '');
        list.appendChild(row);
    });
}

async function updateHit(id, col, val) {
    const upd = {}; upd[col] = val;
    await _supabase.from('boss_hits').update(upd).eq('id', id);
}

async function updateMemberName(id, newName) {
    if (!newName.trim()) return;
    await _supabase.from('boss_hits').update({ member_name: newName }).eq('id', id);
}

async function addMember() {
    const name = document.getElementById('new-member-name').value.trim();
    if (!name) return;
    await _supabase.from('boss_hits').insert([{ member_name: name }]);
    location.reload();
}

async function clearAllHits() {
    if (confirm("Reset everyone?")) {
        await _supabase.from('boss_hits').update({ hit_1: false, hit_2: false, hit_3: false }).neq('id', 0);
        location.reload();
    }
}

async function sendToDiscord() {
    const { data } = await _supabase.from('boss_hits').select('*').order('member_name');
    let text = "```\nNAME             H1  H2  H3\n---------------------------\n";
    data.forEach(m => {
        let n = m.member_name.padEnd(16).substring(0, 16);
        let h1 = m.hit_1 ? "X " : "OK";
        let h2 = m.hit_2 ? "X " : "OK";
        let h3 = m.hit_3 ? "X " : "OK";
        text += n + " [" + h1 + "] [" + h2 + "] [" + h3 + "]\n";
    });
    text += "```\n*OK = Needs Hit | X = Done*";
    await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [{ title: "LME Tracker Update", description: text, color: 15158332 }] })
    });
    alert("Posted!");
}

async function delMember(id) {
    if (confirm("Remove?")) {
        await _supabase.from('boss_hits').delete().eq('id', id);
        location.reload();
    }
}

async function logout() { await _supabase.auth.signOut(); location.reload(); }

init();
