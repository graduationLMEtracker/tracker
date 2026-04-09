const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

async function init() {
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

    if (error) {
        document.getElementById('member-list').innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
        return;
    }

    const list = document.getElementById('member-list');
    list.innerHTML = '';

    data.forEach(m => {
        const row = document.createElement('tr');
        
        // If logged in, show an input box. If logged out, show plain text.
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

async function delMember(id) {
    if (confirm("Are you sure you want to remove this member?")) {
        await _supabase.from('boss_hits').delete().eq('id', id);
        location.reload();
    }
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

init();
