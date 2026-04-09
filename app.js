const _supabase = supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

async function loadTable() {
    const { data: session } = await _supabase.auth.getSession();
    const isAdmin = !!session.session;

    if (isAdmin) {
        document.getElementById('admin-controls').style.display = 'block';
        document.getElementById('login-section').style.display = 'none';
    }

    const { data, error } = await _supabase.from('boss_hits').select('*').order('member_name', { ascending: true });
    
    const tbody = document.getElementById('hit-table-body');
    tbody.innerHTML = '';

    data.forEach(member => {
        const row = `
            <tr>
                <td>${member.member_name}</td>
                <td><input type="checkbox" ${member.hit_1 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_1', this.checked)"></td>
                <td><input type="checkbox" ${member.hit_2 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_2', this.checked)"></td>
                <td><input type="checkbox" ${member.hit_3 ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} onchange="updateHit(${member.id}, 'hit_3', this.checked)"></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function updateHit(id, column, value) {
    const updateData = {};
    updateData[column] = value;
    const { error } = await _supabase.from('boss_hits').update(updateData).eq('id', id);
    if (error) alert("Error updating: " + error.message);
}

async function logout() {
    await _supabase.auth.signOut();
    window.location.reload();
}

loadTable();
