const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1491631332936253530/wHXUuVlzPQF40J7XYocfwp58LMdVFA4g4RqPJk4Kcr2S_OiaksvTOWVaoevB4fNjewC0';

let _supabase;
let currentTable = 'boss_hits';

async function init() {
    if (typeof supabase === 'undefined') {
        setTimeout(init, 500);
        return;
    }
    _supabase = supabase.createClient(SB_URL, SB_KEY);
    const sessionRes = await _supabase.auth.getSession();
    const isAdmin = !!(sessionRes.data && sessionRes.data.session);
    
    if (isAdmin) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('admin-tools').style.display = 'flex';
        document.getElementById('user-email').innerText = sessionRes.data.session.user.email + " | ";
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'table-cell');
    }
    fetchMembers(isAdmin);
}

function switchTable(tableName) {
    currentTable = tableName;
    const isMain = tableName === 'boss_hits';
    document.getElementById('list-title').innerText = isMain ? "Graduation Tracker" : "Graduation 1.0 Tracker";
    document.getElementById('btn-main').className = isMain ? "btn primary" : "btn secondary";
    document.getElementById('btn-v1').className = isMain ? "btn secondary" : "btn primary";
    init();
}

async function fetchMembers(isAdmin) {
    const list = document.getElementById('member-list');
    const res = await _supabase.from(currentTable).select('*').order('member_name', { ascending: true });
    
    if (res.error) {
        list.innerHTML = '<tr><td colspan="5">Error: ' + res.error.message + '</td></tr>';
        return;
    }
    
    list.innerHTML = '';
    res.data.forEach(function(m) {
        const row = document.createElement('tr');
        const nameDisplay = isAdmin ? '<input type="text" class="edit-name-input" value="' + m.member_name + '" onchange="updateMemberName(' + m.id + ', this.value)">' : '<span>' + m.member_name + '</span>';
        
        row.innerHTML = '<td>' + nameDisplay + '</td>' +
            '<td><input type="checkbox" ' + (m.hit_1 ? 'checked' : '') + ' ' + (!isAdmin ? 'disabled' : '') + ' onchange="updateHit(' + m.id + ', \'hit_1\', this.checked)"></td>' +
            '<td><input type="checkbox" ' + (m.hit_2 ? 'checked' : '') + ' ' + (!isAdmin ? 'disabled' : '') + ' onchange="updateHit(' + m.id + ', \'hit_2\', this.checked)"></td>' +
            '<td><input type="checkbox" ' + (m.hit_3 ? 'checked' : '') + ' ' + (!isAdmin ? 'disabled' : '') + ' onchange="updateHit(' + m.id + ', \'hit_3\', this.checked)"></td>' +
            (isAdmin ? '<td class="admin-only"><button class="btn danger" onclick="delMember(' + m.id + ')">Remove</button></td>' : '');
        list.appendChild(row);
    });
}

async function secretPost() {
    const code = prompt("Enter Secret Code:");
    if (code === "banana67") {
        const msg = prompt("Enter custom message for Discord:");
        if (!msg) return;
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: msg })
        });
        alert("Sent!");
    }
}

async function updateHit(id, col, val) {
    const upd = {}; upd[col] = val;
    await _supabase.from(currentTable).update(upd).eq('id', id);
}

async function updateMemberName(id, newName) {
    if (!newName.trim()) return;
    await _supabase.from(currentTable).update({ member_name: newName }).eq('id', id);
}

async function addMember() {
    const input = document.getElementById('new-member-name');
    const name = input.value.trim();
    if (!name) return;
    await _supabase.from(currentTable).insert([{ member_name: name }]);
    input.value = '';
    init();
}

async function clearAllHits() {
    if (confirm("Reset everyone on this list?")) {
        await _supabase.from(currentTable).update({ hit_1: false, hit_2: false, hit_3: false }).neq('id', 0);
        init();
    }
}

async function sendToDiscord() {
    const res = await _supabase.from(currentTable).select('*').order('member_name');
    const listName = currentTable === 'boss_hits' ? "Graduation" : "Graduation 1.0";
    let text = "**[H1] [H2] [H3] | MEMBER NAME**\n--------------------------------------\n";
    
    res.data.forEach(function(m) {
        const h1 = m.hit_1 ? "❌" : "✅";
        const h2 = m.hit_2 ? "❌" : "✅";
        const h3 = m.hit_3 ? "❌" : "✅";
        text += h1 + " " + h2 + " " + h3 + " | **" + m.member_name + "**\n";
    });
    text += "\n✅ = Hit Complete | ❌ = Missed Hit";
    
    await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            embeds: [{ title: "🛡️ " + listName + " Strike Report", description: text, color: 15158332 }] 
        })
    });
    alert("Posted!");
}

async function delMember(id) {
    if (confirm("Remove?")) {
        await _supabase.from(currentTable).delete().eq('id', id);
        init();
    }
}

async function logout() { await _supabase.auth.signOut(); location.reload(); }

init();
