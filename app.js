const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1491631332936253530/wHXUuVlzPQF40J7XYocfwp58LMdVFA4g4RqPJk4Kcr2S_OiaksvTOWVaoevB4fNjewC0';

let _supabase;

async function init() {
    try {
        _supabase = supabase.createClient(SB_URL, SB_KEY);
    } catch (e) {
        document.getElementById('member-list').innerHTML = `<tr><td colspan="5">Library Error: Refresh the page.</td></tr>`;
        return;
    }

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
    const { data, error } = await _supabase
        .from('boss_hits')
        .select('*')
        .order('member_name', { ascending: true });

    const list = document.getElementById('member-list');

    if (error) {
        list.innerHTML = `<tr><td colspan="5">Database Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = `<tr><td colspan="5">No members found. Use Admin tools to add some!</td></tr>`;
        return;
    }

    list.innerHTML = '';

    data.forEach(m => {
        const row = document.createElement('tr');
        const nameCell = isAdmin 
            ? `<input type="text" class="edit-name-input" value="${m.member_name}" onchange="updateMemberName(${m.id}, this.value)">`
            : `<span>${m.member_name}</span>`;

        row.innerHTML = `
            <td>${nameCell}</td>
            <td><input type="checkbox" ${m.hit_1 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${m.id}, 'hit_1', this.checked)"></td>
            <td><input type="checkbox" ${m.hit_2 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${m.id}, 'hit_2', this.checked)"></td>
            <td><input type="checkbox" ${m.hit_3 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${m.id}, 'hit_3', this.checked)"></td>
            ${isAdmin ? `<td class="admin-only"><button class="btn danger" onclick="delMember(${m.id})">Remove</button></td>` : ''}
        `;
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
    const nameInput = document.getElementById('new-member-name');
    const name = nameInput.value.trim();
    if (!name) return;
    const { error } = await _supabase.from('boss_hits').insert([{ member_name: name }]);
    if (error) alert(error.message);
    else location.reload();
}

async function clearAllHits() {
    if (confirm("Reset all hits for everyone?")) {
        await _supabase.from('boss_hits').update({ hit_1: false, hit_2: false, hit_3: false }).neq('id', 0);
        location.reload();
    }
}

async function sendToDiscord() {
    const { data, error: dbError } = await _supabase.from('boss_hits').select('*').order('member_name');
    if (dbError) return alert("Database error: " + dbError.message);

    let description = "✅ = Needs to Hit | ❌ = Hit Complete\n\n";
    data.forEach(m => {
        // Reversed Logic: If true (checked on web), show X. If false, show Check.
        const h1 = m.hit_1 ? "❌" : "✅";
        const h2 = m.hit_2 ? "❌" : "✅";
        const h3 = m.hit_3 ? "❌" : "✅";
        description += `**${m.member_name}**: ${h1} ${h2} ${h3}\n`;
    });

    const embed = {
        title: "🛡️ Graduation LME - Pending Boss Hits",
        description: description || "No members found.",
        color: 15158332, // Red color for urgency
        timestamp: new Date(),
        footer: { text: "Get those hits in!" }
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
        if (response.ok) alert("Posted to Discord!");
        else alert("Post failed: Discord blocked the request.");
    } catch (err) {
        alert("Network error checking Discord.");
    }
}

async function delMember(id) {
    if (confirm("Remove this member?")) {
        await _supabase.from('boss_hits').delete().eq('id', id);
        location.reload();
    }
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

setTimeout(init, 500);
