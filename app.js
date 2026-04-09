const SB_URL = 'https://mcdiohrcotqrldydpswg.supabase.co';
const SB_KEY = 'sb_publishable_jkGjJ5973O6jiiN9XRKs4g_iK9R1s8m';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

async function init() {
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = !!session;

    if (isAdmin) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('user-email').innerText = session.user.email;
        document.getElementById('admin-tools').style.display = 'block';
    }

    fetchMembers(isAdmin);
}

async function fetchMembers(isAdmin) {
    const { data, error } = await _supabase
        .from('boss_hits')
        .select('*')
        .order('member_name', { ascending: true });

    if (error) {
        document.getElementById('member-list').innerHTML = `<tr><td colspan="5">Error loading data.</td></tr>`;
        return;
    }

    const list = document.getElementById('member-list');
    list.innerHTML = '';

    // Show action header if admin
    if(isAdmin) document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'table-cell');

    data.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.member_name}</td>
            <td><input type="checkbox" ${member.hit_1 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_1', this.checked)"></td>
            <td><input type="checkbox" ${member.hit_2 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_2', this.checked)"></td>
            <td><input type="checkbox" ${member.hit_3 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_3', this.checked)"></td>
            ${isAdmin ? `<td><button class="btn danger" style="padding: 4px 8px; font-size: 0.7em;" onclick="deleteMember(${member.id})">Remove</button></td>` : ''}
        `;
        list.appendChild(row);
    });
}

async function updateHit(id, column, value) {
    const obj = {};
    obj[column] = value;
    await _supabase.from('boss_hits').update(obj).eq('id', id);
}

async function addMember() {
    const name = document.getElementById('new-member-name').value;
    if (!name) return;
    await _supabase.from('boss_hits').insert([{ member_name: name }]);
    document.getElementById('new-member-name').value = '';
    init();
}

async function deleteMember(id) {
    if (confirm("Remove this member?")) {
        await _supabase.from('boss_hits').delete().eq('id', id);
        init();
    }
}

async function logout() {
    await _supabase.auth.signOut();
    window.location.reload();
}

init();
