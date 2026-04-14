const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1491631332936253530/wHXUuVlzPQF40J7XYocfwp58LMdVFA4g4RqPJk4Kcr2S_OiaksvTOWVaoevB4fNjewC0';

let _supabase;
let currentTable = 'boss_hits'; // Default table

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
        document.getElementById('user-email').innerText = (session.user.email) + " | ";
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'table-cell');
    }
    fetchMembers(isAdmin);
}

// Logic to swap between the two lists
function switchTable(tableName) {
    currentTable = tableName;
    
    // Update UI highlights
    const isMain = tableName === 'boss_hits';
    document.getElementById('list-title').innerText = isMain ? "Graduation Tracker" : "Graduation 1.0 Tracker";
    document.getElementById('btn-main').style.background = isMain ? "#4a90e2" : "#444";
    document.getElementById('btn-v1').style.background = isMain ? "#444" : "#4a90e2";
    
    // Reload the list
    init(); 
}

async function fetchMembers(isAdmin) {
    const list = document.getElementById('member-list');
    const { data, error } = await _supabase.from(currentTable).select('*').order('member_name', { ascending: true });
    
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
            (isAdmin ? '<td class="admin-only"><button class="btn danger" onclick="delMember(' + m.id + ')">Remove</button></td>' : '');
        list.appendChild(row);
    });
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
    const name = document.getElementById('new-member-name').value.trim();
    if (!name) return;
    await _supabase.from(currentTable).insert([{ member_name: name }]);
    init(); // Refresh list without full page reload
    document.getElementById('new-member-name').value = '';
}

async function clearAllHits() {
    if (confirm("Reset everyone in " + (currentTable === 'boss_hits' ? "Graduation" : "Graduation 1.0") + "?")) {
        await _supabase.from(currentTable).update({ hit_1: false, hit_2: false, hit_3: false }).neq('id', 0);
        init();
    }
}

async function sendToDiscord() {
    const { data } = await _supabase.from(currentTable).select('*').order('member_name');
    const listName = currentTable === 'boss_hits' ? "Graduation" : "Graduation 1.0";
    
    let text = "**[H1] [H2] [H3] | MEMBER NAME**\n";
    text += "--------------------------------------\n";
    
    data.forEach(m => {
        const h1 = m.hit_1 ? "❌" : "✅";
        const h2 = m.hit_2 ? "❌" : "✅";
        const h3 = m.hit_3 ? "❌" : "✅";
        text += h1 + " " + h2 + " " + h3 + " | **" + m.member_name + "**\n";
    });
    
    text += "\n*✅ = Hit Complete | ❌ = STRIKE (Missed Hit)*";
    
    await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            embeds: [{ 
                title: "🛡️ " + listName + " Strike Report", 
                description: text, 
                color: 15158332,
                timestamp: new Date()
            }] 
        })
    });
    alert("Posted " + listName + " to Discord!");
}

async function delMember(id) {
    if (confirm("Remove?")) {
        await _supabase.from(currentTable).delete().eq('id', id);
        init();
    }
}

async function logout() { await _supabase.auth.signOut(); location.reload(); }

init();
