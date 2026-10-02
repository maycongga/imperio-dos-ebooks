// ============================================================
// ESTADO
// ============================================================
let produtos = [];      // só os ebooks à venda (loja)
let todosEbooks = [];   // todos, inclusive ocultos (painel admin)
let modoRecuperacao = false;   // true quando a pessoa abriu o link "esqueci minha senha"
let usuarioLogadoId = null;    // evita recarregar a loja sem necessidade

// ============================================================
// UTILITÁRIOS
// ============================================================
function esc(t){
  return String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function normalizar(t){
  return String(t || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function traduzirErro(m){
  const t = String(m || "").toLowerCase();
  if(t.includes("invalid login")) return "E-mail ou senha incorretos.";
  if(t.includes("email not confirmed")) return "Confirme seu e-mail (veja a caixa de entrada e o spam) antes de entrar.";
  if(t.includes("already registered")) return "Esse e-mail já tem conta. Use a aba \"Entrar\".";
  if(t.includes("rate limit") || t.includes("too many")) return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if(t.includes("at least 6")) return "A senha precisa ter no mínimo 6 caracteres.";
  if(t.includes("different from the old") || t.includes("same password")) return "A nova senha precisa ser diferente da atual.";
  return m;
}

// ============================================================
// CATEGORIAS (lista única: gera os cartões, o formulário, as cores e os emojis)
// ============================================================
// As 16 primeiras têm chave fixa (os ebooks já publicados usam essas chaves).
// Nas demais, a chave nasce do nome. Por isso: depois de publicar ebooks numa
// categoria, não troque o nome dela aqui.
const CATEGORIAS_BASE = [
  { key:"negocios", emoji:"💼", nome:"Negócios e Carreira", frase:"Pra quem quer crescer no trampo" },
  { key:"financas", emoji:"💰", nome:"Finanças e Investimentos", frase:"Organiza o bolso, multiplica a grana" },
  { key:"pessoal", emoji:"🌱", nome:"Desenvolvimento Pessoal", frase:"Vira a chave e evolui" },
  { key:"saude", emoji:"🍏", nome:"Saúde e Fitness", frase:"Corpo e mente no eixo" },
  { key:"tech", emoji:"💻", nome:"Tecnologia e Programação", frase:"Aprende a criar o futuro" },
  { key:"criativo", emoji:"🎨", nome:"Criatividade e Hobbies", frase:"Solta a imaginação" },
  { key:"familia", emoji:"🏠", nome:"Família e Casa", frase:"Dicas pro dia a dia em casa" },
  { key:"educacao", emoji:"📚", nome:"Educação e Concursos", frase:"Estuda com direção certa" },
  { key:"ficcao", emoji:"🎭", nome:"Ficção e Entretenimento", frase:"Pra viajar sem sair do lugar" },
  { key:"renda", emoji:"🚀", nome:"Ganhar Dinheiro em Casa", frase:"Renda extra do seu jeito" },
  { key:"marketing", emoji:"📣", nome:"Marketing Digital", frase:"Venda mais na internet" },
  { key:"relacionamentos", emoji:"💞", nome:"Relacionamentos", frase:"Amor, amizade e convivência" },
  { key:"espiritualidade", emoji:"🙏", nome:"Espiritualidade e Fé", frase:"Paz interior e propósito" },
  { key:"culinaria", emoji:"🍳", nome:"Culinária e Receitas", frase:"Sabor de verdade na sua cozinha" },
  { key:"idiomas", emoji:"🌎", nome:"Idiomas", frase:"Fale outra língua com confiança" },
  { key:"pets", emoji:"🐶", nome:"Pets e Animais", frase:"Cuidar bem de quem você ama" }
];

// Uma por linha: emoji + nome. Para criar categoria nova, é só acrescentar uma linha.
const CATEGORIAS_NOVAS = `
🌟 Autoajuda
🔥 Motivação
💗 Inteligência Emocional
🪞 Autoconhecimento
⚡ Produtividade
⏰ Gestão do Tempo
🔁 Hábitos
🎯 Disciplina
🧘 Mindfulness
✝️ Fé Cristã
📖 Bíblia e Estudos Bíblicos
🙌 Oração
🕊️ Devocionais
💍 Casamento Cristão
👨‍👩‍👧 Família e Valores
🧒 Educação dos Filhos
👫 Vida a Dois
❤️ Amor e Romance
🧠 Psicologia
🗣️ Comunicação
🧭 Liderança
🤝 Inteligência Social
👷 Profissões
💡 Empreendedorismo
📋 Administração
🏢 Gestão Empresarial
📱 Redes Sociais
📸 Instagram
🎵 TikTok
▶️ YouTube
🛒 Vendas
✍️ Copywriting
🔗 Afiliados
💵 Renda Extra
🌐 Trabalho Online
🏡 Home Office
🧑‍💻 Freelancing
👛 Finanças Pessoais
🎓 Educação Financeira
📈 Investimentos
🏦 Economia
🗂️ Organização Financeira
🧮 Planejamento Financeiro
💚 Saúde e Bem-Estar
🥗 Alimentação Saudável
🍲 Receitas
🪚 Marcenaria
🪵 Carpintaria
🔧 Mecânica Automotiva
🏍️ Mecânica de Motos
🔋 Elétrica Automotiva
🔌 Eletricista
🎛️ Eletrônica
❄️ Refrigeração e Climatização
🧑‍🏭 Soldagem
🔩 Serralheria
🏗️ Construção Civil
🧱 Pedreiro
🖌️ Pintura Residencial
🚰 Hidráulica
🪠 Encanador
🧰 Gesso e Drywall
📐 Instalação de Pisos
🪨 Alvenaria
🌿 Jardinagem
🌳 Paisagismo
🖥️ Tecnologia da Informação
🖱️ Informática
👨‍💻 Programação
🕸️ Desenvolvimento Web
📲 Desenvolvimento de Aplicativos
🗄️ Banco de Dados
🛜 Redes de Computadores
🔐 Segurança da Informação
🛠️ Suporte Técnico
💾 Hardware
🐧 Linux
🪟 Windows
📊 Excel
📄 Word e Office
🤖 Inteligência Artificial
⚙️ Automação
🦾 Robótica
🖼️ Design Gráfico
🎬 Edição de Vídeo
🌍 Criação de Sites
📷 Fotografia
🧵 Costura
✂️ Modelagem
💇 Cabeleireiro
💈 Barbearia
💅 Manicure e Pedicure
💄 Maquiagem
🎂 Confeitaria
🍞 Panificação
👨‍🍳 Culinária Profissional
🍽️ Garçom e Atendimento
🎧 Atendimento ao Cliente
🧾 Contabilidade
👥 Recursos Humanos
🚚 Logística
📦 Estoque
🚛 Transporte
🦺 Segurança do Trabalho
🧶 Artesanato
🎁 Personalização de Produtos
👕 Sublimação
🔴 Corte a Laser
🧊 Impressão 3D
🪑 Produção de Móveis
🛋️ Móveis Planejados
🔨 Restauração de Móveis
🏺 Produtos Artesanais
🏪 Pequenos Negócios
`;

const PALETA_CATEGORIA = [
  ["#8B5CF6","#FF3E7F"], ["#FFD23F","#FF3E7F"], ["#34D399","#38BDF8"], ["#34D399","#FFD23F"],
  ["#38BDF8","#8B5CF6"], ["#F472B6","#8B5CF6"], ["#FB923C","#FFD23F"], ["#8B5CF6","#38BDF8"],
  ["#F472B6","#FF3E7F"], ["#FF3E7F","#8B5CF6"], ["#FF3E7F","#FFD23F"], ["#FB923C","#FF3E7F"]
];

const CATEGORIAS = [
  ...CATEGORIAS_BASE,
  ...CATEGORIAS_NOVAS.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(" ");
    const nome = l.slice(i + 1).trim();
    const key = normalizar(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return { key, emoji: l.slice(0, i), nome, frase: "" };
  })
];

const CORES_CATEGORIA = {};
const EMOJI_CATEGORIA = {};
const NOMES_CATEGORIA = {};
CATEGORIAS.forEach((c, i) => {
  const [a, b] = PALETA_CATEGORIA[i % PALETA_CATEGORIA.length];
  c.ponto = a;
  CORES_CATEGORIA[c.key] = `linear-gradient(135deg,${a},${b})`;
  EMOJI_CATEGORIA[c.key] = c.emoji;
  NOMES_CATEGORIA[c.key] = c.nome;
});

const CATEGORIAS_VISIVEIS = 12; // quantas aparecem antes de clicar em "Ver todas"

function montarCategorias(){
  document.getElementById("gridCategorias").innerHTML = CATEGORIAS.map((c, i) => `
    <div class="categoria${i >= CATEGORIAS_VISIVEIS ? " extra" : ""}" data-cat="${esc(c.key)}" style="--cor:${c.ponto}">
      <span class="emoji">${c.emoji}</span><h3>${esc(c.nome)}</h3>${c.frase ? `<p>${esc(c.frase)}</p>` : ""}
    </div>`).join("");

  document.getElementById("pCategoria").innerHTML =
    `<option value="">Categoria...</option>` +
    CATEGORIAS.map(c => `<option value="${esc(c.key)}">${c.emoji} ${esc(c.nome)}</option>`).join("");

  document.getElementById("btnVerTodasCat").textContent = `Ver todas as ${CATEGORIAS.length} categorias`;
}

function alternarCategorias(){
  const grid = document.getElementById("gridCategorias");
  const abrir = grid.dataset.aberta !== "1";
  grid.dataset.aberta = abrir ? "1" : "0";
  grid.classList.toggle("aberta", abrir);
  document.getElementById("btnVerTodasCat").textContent =
    abrir ? "Mostrar menos" : `Ver todas as ${CATEGORIAS.length} categorias`;
}

function filtrarCategorias(){
  const t = normalizar(document.getElementById("filtroCategoria").value);
  const grid = document.getElementById("gridCategorias");
  grid.classList.toggle("aberta", !!t || grid.dataset.aberta === "1");
  let visiveis = 0;
  grid.querySelectorAll(".categoria").forEach(el => {
    const bate = !t || normalizar(el.querySelector("h3").textContent).includes(t);
    el.style.display = bate ? "" : "none";
    if(bate) visiveis++;
  });
  document.getElementById("btnVerTodasCat").style.display = t ? "none" : "";
  document.getElementById("catVazia").style.display = visiveis === 0 ? "block" : "none";
}

montarCategorias();

// ============================================================
// AUTENTICAÇÃO
// ============================================================
function alternarSenha(id, botao){
  const campo = document.getElementById(id);
  const mostrando = campo.type === "text";
  campo.type = mostrando ? "password" : "text";
  botao.textContent = mostrando ? "👁" : "🙈";
}

function mostrarTab(tab){
  const loginOuCadastro = tab === "login" || tab === "cadastro";
  document.getElementById("authTabs").style.display = loginOuCadastro ? "flex" : "none";
  document.getElementById("authExtras").style.display = loginOuCadastro ? "block" : "none";
  document.getElementById("tabLogin").classList.toggle("active", tab === "login");
  document.getElementById("tabCadastro").classList.toggle("active", tab === "cadastro");
  document.getElementById("formLogin").style.display = tab === "login" ? "flex" : "none";
  document.getElementById("formCadastro").style.display = tab === "cadastro" ? "flex" : "none";
  document.getElementById("formRecuperar").style.display = tab === "recuperar" ? "flex" : "none";
  document.getElementById("formNovaSenha").style.display = tab === "novasenha" ? "flex" : "none";
}

async function fazerCadastro(event){
  event.preventDefault();
  const email = document.getElementById("cadEmail").value.trim();
  const telefone = document.getElementById("cadTelefone").value.trim();
  const senha = document.getElementById("cadSenha").value;
  const msg = document.getElementById("cadMsg");
  msg.textContent = "Criando conta...";

  const { error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: { data: { telefone } }
  });

  if(error){
    msg.textContent = traduzirErro(error.message);
  } else {
    msg.textContent = "";
    mostrarTab("login");
    // a mensagem vai na aba de login, que é a que fica visível
    document.getElementById("loginEmail").value = email;
    document.getElementById("loginMsg").textContent =
      "Conta criada! Se pedirmos, confirme seu e-mail (olhe o spam) e depois entre.";
  }
  return false;
}

async function fazerLogin(event){
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const msg = document.getElementById("loginMsg");
  msg.textContent = "Entrando...";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

  if(error){
    msg.textContent = traduzirErro(error.message);
  } else {
    msg.textContent = "";
  }
  return false;
}

// ---------- RECUPERAR SENHA ----------
async function enviarRecuperacao(event){
  event.preventDefault();
  const email = document.getElementById("recEmail").value.trim();
  const msg = document.getElementById("recMsg");
  msg.textContent = "Enviando...";

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  if(error){
    msg.textContent = traduzirErro(error.message);
  } else {
    msg.textContent = "Se esse e-mail tiver conta, o link chega em instantes. Olhe também o spam.";
  }
  return false;
}

async function salvarNovaSenha(event){
  event.preventDefault();
  const s1 = document.getElementById("novaSenha1").value;
  const s2 = document.getElementById("novaSenha2").value;
  const msg = document.getElementById("novaMsg");

  if(s1.length < 6){ msg.textContent = "A senha precisa ter no mínimo 6 caracteres."; return false; }
  if(s1 !== s2){ msg.textContent = "As senhas não são iguais."; return false; }

  msg.textContent = "Salvando...";
  const { error } = await supabaseClient.auth.updateUser({ password: s1 });
  if(error){
    msg.textContent = traduzirErro(error.message);
    return false;
  }

  msg.textContent = "Senha alterada ✓ Entrando...";
  modoRecuperacao = false;
  history.replaceState(null, "", window.location.pathname);
  const { data: { session } } = await supabaseClient.auth.getSession();
  setTimeout(() => {
    document.getElementById("novaSenha1").value = "";
    document.getElementById("novaSenha2").value = "";
    msg.textContent = "";
    mostrarTab("login");
    aoMudarSessao(session);
  }, 1200);
  return false;
}

async function sair(){
  await supabaseClient.auth.signOut();
  fecharPerfil();
}

async function loginComGoogle(){
  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
}

function abrirPerfil(){
  document.getElementById("perfilView").style.display = "flex";
  carregarCompras();
}

function fecharPerfil(){
  document.getElementById("perfilView").style.display = "none";
}

function nomeAPartirDoEmail(email){
  const parte = email.split("@")[0] || "";
  return parte
    .replace(/[._]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

async function carregarCompras(){
  const lista = document.getElementById("listaComprados");
  lista.innerHTML = `<p class="avatar-vazio">Carregando...</p>`;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return;

  const { data, error } = await supabaseClient
    .from("compras")
    .select("ebook_id, ebooks(titulo)")
    .eq("user_email", session.user.email)
    .eq("status", "pago");

  if(error || !data || data.length === 0){
    lista.innerHTML = `<p class="avatar-vazio">Nenhum ebook comprado ainda.</p>`;
    return;
  }

  lista.innerHTML = data.map(c => `
    <div class="item-comprado" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
      <span>📘 ${esc(c.ebooks?.titulo || "Ebook")}</span>
      <span style="display:flex;gap:6px;flex-shrink:0">
        <button class="comprar-btn" style="background:var(--pink)" data-t="${esc(c.ebooks?.titulo || "Ebook")}" onclick="abrirAulas(${Number(c.ebook_id)}, this.dataset.t)">Aulas</button>
        <button class="comprar-btn" onclick="baixarEbook(${Number(c.ebook_id)}, this)">Baixar</button>
      </span>
    </div>`).join("");
}

async function baixarEbook(ebookId, botao){
  const textoOriginal = botao.textContent;
  botao.textContent = "Gerando...";
  botao.disabled = true;

  const { data, error } = await supabaseClient.functions.invoke("baixar-ebook", {
    body: { ebookId }
  });

  if(error || !data || data.error){
    botao.textContent = "Erro";
    alert(data?.error || "Não foi possível baixar agora. Tente de novo.");
  } else {
    window.location.href = data.url;
    botao.textContent = "Baixando ✓";
  }
  setTimeout(() => { botao.textContent = textoOriginal; botao.disabled = false; }, 2500);
}

function aoMudarSessao(session){
  if(modoRecuperacao) return; // durante a troca de senha, não abre a loja

  const gate = document.getElementById("authGate");
  const app = document.getElementById("app");
  const btnPublicar = document.getElementById("btnPublicar");

  if(session){
    gate.style.display = "none";
    app.style.display = "block";
    const ehAdmin = session.user.email === ADMIN_EMAIL;
    btnPublicar.style.display = ehAdmin ? "inline-block" : "none";
    document.getElementById("btnAdmin").style.display = ehAdmin ? "inline-block" : "none";

    const email = session.user.email || "";
    const telefone = session.user.user_metadata?.telefone;
    const inicial = email.charAt(0).toUpperCase();

    document.getElementById("avatarBtn").textContent = inicial;
    document.getElementById("avatarBtnGrande").textContent = inicial;
    document.getElementById("perfilNome").textContent = nomeAPartirDoEmail(email);
    document.getElementById("perfilEmail").textContent = email;
    document.getElementById("perfilTelefone").textContent = telefone ? `📱 ${telefone}` : "Telefone não informado";

    // só recarrega os ebooks quando a pessoa muda (evita recarregar a cada troca de aba)
    if(usuarioLogadoId !== session.user.id){
      usuarioLogadoId = session.user.id;
      carregarProdutos();
    }
  } else {
    usuarioLogadoId = null;
    gate.style.display = "flex";
    app.style.display = "none";
  }
}

supabaseClient.auth.onAuthStateChange((evento, session) => {
  if(evento === "PASSWORD_RECOVERY"){
    modoRecuperacao = true;
    document.getElementById("app").style.display = "none";
    document.getElementById("authGate").style.display = "flex";
    mostrarTab("novasenha");
    return;
  }
  aoMudarSessao(session);
});
supabaseClient.auth.getSession().then(({ data: { session } }) => aoMudarSessao(session));

// ============================================================
// PRODUTOS (EBOOKS)
// ============================================================
const gridProdutos = document.getElementById("gridProdutos");

function formatarPreco(v){
  return Number(v).toFixed(2).replace(".", ",");
}

async function carregarProdutos(){
  document.getElementById("contadorEbooks").textContent = "carregando ebooks...";
  const { data, error } = await supabaseClient
    .from("ebooks")
    .select("id,titulo,categoria,preco,preco_antigo,criado_em,ativo")
    .order("criado_em", { ascending: false });

  if(error){
    gridProdutos.innerHTML = `<p style="color:var(--muted)">Não deu pra carregar os ebooks agora. Verifique a configuração do Supabase.</p>`;
    document.getElementById("contadorEbooks").textContent = "não foi possível carregar os ebooks";
    return;
  }

  todosEbooks = data || [];
  produtos = todosEbooks.filter(p => p.ativo !== false);
  const n = produtos.length;
  document.getElementById("contadorEbooks").textContent =
    n === 1 ? "1 ebook disponível agora" : `${n} ebooks disponíveis agora`;
  renderizarProdutos(produtos);
}

function renderizarProdutos(lista){
  gridProdutos.innerHTML = "";
  if(lista.length === 0){
    gridProdutos.innerHTML = `<p style="color:var(--muted)">Nenhum ebook encontrado ainda.</p>`;
    return;
  }
  lista.forEach(p => {
    const cor = CORES_CATEGORIA[p.categoria] || "linear-gradient(135deg,#8B5CF6,#FF3E7F)";
    const emoji = EMOJI_CATEGORIA[p.categoria] || "📘";
    const card = document.createElement("div");
    card.className = "produto";
    card.innerHTML = `
      <div class="capa" style="background:${cor}">${emoji}</div>
      <div class="produto-info">
        <h3>${esc(p.titulo)}</h3>
        <p>Ebook digital · acesso imediato</p>
        <div class="preco-linha">
          <span>${p.preco_antigo ? `<span class="preco-antigo">R$ ${formatarPreco(p.preco_antigo)}</span>` : ""}<span class="preco">R$ ${formatarPreco(p.preco)}</span></span>
          <button class="comprar-btn" data-id="${Number(p.id)}">Comprar</button>
        </div>
      </div>
    `;
    gridProdutos.appendChild(card);
  });
}

// ============================================================
// COMPRAR COM PIX (Mercado Pago)
// ============================================================
let timerPagamento = null;
let pixCopiaECola = "";

function mostrarPixEstado(estado){
  document.getElementById("pixCarregando").style.display = estado === "carregando" ? "block" : "none";
  document.getElementById("pixQr").style.display = estado === "qr" ? "block" : "none";
  document.getElementById("pixOk").style.display = estado === "ok" ? "block" : "none";
  document.getElementById("pixErro").style.display = estado === "erro" ? "block" : "none";
}

function fecharModalPix(){
  clearInterval(timerPagamento);
  timerPagamento = null;
  document.getElementById("modalPix").style.display = "none";
}

async function copiarPix(){
  try{
    await navigator.clipboard.writeText(pixCopiaECola);
    const b = document.getElementById("btnCopiarPix");
    b.textContent = "Copiado ✓";
    setTimeout(() => (b.textContent = "Copiar código Pix"), 1500);
  }catch(_e){
    document.getElementById("pixCodigo").select();
  }
}

function vigiarPagamento(paymentId){
  clearInterval(timerPagamento);
  let tentativas = 0;
  timerPagamento = setInterval(async () => {
    tentativas++;
    if(tentativas > 150){ clearInterval(timerPagamento); return; } // ~10 minutos
    const { data } = await supabaseClient
      .from("compras").select("status").eq("payment_id", paymentId).maybeSingle();
    if(data?.status === "pago"){
      clearInterval(timerPagamento);
      mostrarPixEstado("ok");
      setTimeout(fecharModalPix, 2500);
    }
  }, 4000);
}

async function comprarEbook(ebookId){
  document.getElementById("modalPix").style.display = "flex";
  mostrarPixEstado("carregando");

  const { data, error } = await supabaseClient.functions.invoke("criar-pagamento-pix", {
    body: { ebookId }
  });

  if(error || !data || data.error){
    document.getElementById("pixErroTexto").textContent =
      data?.error || "Não foi possível gerar o Pix agora. Tente de novo.";
    mostrarPixEstado("erro");
    return;
  }

  if(data.status === "ja_comprado"){
    document.getElementById("pixErroTexto").textContent = "Você já comprou esse ebook. Ele está no seu perfil.";
    mostrarPixEstado("erro");
    return;
  }

  pixCopiaECola = data.qr_code;
  document.getElementById("pixTitulo").textContent = data.titulo;
  document.getElementById("pixValor").textContent = "R$ " + formatarPreco(data.valor);
  document.getElementById("pixImg").src = "data:image/png;base64," + data.qr_code_base64;
  document.getElementById("pixCodigo").value = data.qr_code;
  mostrarPixEstado("qr");
  vigiarPagamento(data.payment_id);
}

gridProdutos.addEventListener("click", (e) => {
  if(e.target.classList.contains("comprar-btn")){
    comprarEbook(e.target.dataset.id);
  }
});

// ---------- BUSCA (ignora acento e maiúscula; acha por título ou categoria) ----------
function buscar(event){
  event.preventDefault();
  const palavras = normalizar(document.getElementById("campoBusca").value)
    .split(/\s+/).filter(Boolean);

  const filtrados = palavras.length === 0
    ? produtos
    : produtos.filter(p => {
        const texto = normalizar(`${p.titulo} ${p.categoria || ""} ${NOMES_CATEGORIA[p.categoria] || ""}`);
        return palavras.every(w => texto.includes(w));
      });

  renderizarProdutos(filtrados);
  document.getElementById("mais-vendidos").scrollIntoView({ behavior: "smooth" });
  return false;
}

function mostrarTodos(){
  document.getElementById("campoBusca").value = "";
  renderizarProdutos(produtos);
}

// ---------- FILTRO POR CATEGORIA ----------
document.getElementById("gridCategorias").addEventListener("click", (e) => {
  const el = e.target.closest(".categoria");
  if(!el) return;
  document.getElementById("campoBusca").value = "";
  renderizarProdutos(produtos.filter(p => p.categoria === el.dataset.cat));
  document.getElementById("mais-vendidos").scrollIntoView({ behavior: "smooth" });
});

// ============================================================
// PUBLICAR EBOOK (só aparece pro admin)
// ============================================================
function abrirModalPublicar(){
  document.getElementById("modalPublicar").style.display = "flex";
}
function fecharModalPublicar(){
  document.getElementById("modalPublicar").style.display = "none";
}

function paraNumero(v){
  if(!v) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

async function publicarEbook(event){
  event.preventDefault();
  const form = event.target;
  const msg = document.getElementById("pubMsg");
  const botao = document.getElementById("btnPublicarEnviar");
  const arquivo = document.getElementById("pArquivo").files[0];
  if(!arquivo){ msg.textContent = "Escolha o arquivo do ebook."; return false; }

  const preco = paraNumero(document.getElementById("pPreco").value.trim());
  if(preco === null || preco <= 0){ msg.textContent = "Preço inválido."; return false; }

  botao.disabled = true;
  msg.textContent = "Enviando arquivo...";
  const { data: { session } } = await supabaseClient.auth.getSession();

  // nome do arquivo sem acento nem espaço
  const nomeLimpo = arquivo.name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  const caminho = `${Date.now()}-${nomeLimpo}`;

  const { error: erroUpload } = await supabaseClient.storage
    .from("ebooks-privados").upload(caminho, arquivo);
  if(erroUpload){
    msg.textContent = "Erro no envio: " + erroUpload.message;
    botao.disabled = false;
    return false;
  }

  const { error } = await supabaseClient.from("ebooks").insert([{
    titulo: document.getElementById("pTitulo").value.trim(),
    categoria: document.getElementById("pCategoria").value,
    preco,
    preco_antigo: paraNumero(document.getElementById("pPrecoAntigo").value.trim()),
    arquivo_path: caminho,
    autor_email: session.user.email
  }]);

  if(error){
    // desfaz o upload se o cadastro falhou
    await supabaseClient.storage.from("ebooks-privados").remove([caminho]);
    msg.textContent = error.message;
    botao.disabled = false;
    return false;
  }

  msg.textContent = "Ebook publicado!";
  setTimeout(() => {
    fecharModalPublicar();
    msg.textContent = "";
    form.reset();
    botao.disabled = false;
    carregarProdutos();
  }, 800);
  return false;
}

// ============================================================
// PAINEL ADMIN (editar / excluir ebooks)
// ============================================================
function abrirAdmin(){
  document.getElementById("aCategoria").innerHTML = document.getElementById("pCategoria").innerHTML;
  document.getElementById("modalAdmin").style.display = "flex";
  mostrarAdminLista();
}

function fecharAdmin(){
  document.getElementById("modalAdmin").style.display = "none";
}

function mostrarAdminLista(){
  document.getElementById("adminEdicao").style.display = "none";
  document.getElementById("adminLista").style.display = "block";
  document.getElementById("adminMsg").textContent = "";

  const area = document.getElementById("adminItens");
  if(todosEbooks.length === 0){
    area.innerHTML = `<p class="avatar-vazio">Nenhum ebook publicado ainda.</p>`;
    return;
  }
  area.innerHTML = todosEbooks.map(p => {
    const oculto = p.ativo === false;
    return `
    <div class="item-comprado" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;${oculto ? "opacity:.6" : ""}">
      <span style="flex:1;min-width:140px;word-break:break-word">📘 ${esc(p.titulo)}<br><small style="color:var(--muted)">R$ ${formatarPreco(p.preco)}${oculto ? " · oculto da loja" : ""}</small></span>
      <span style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="comprar-btn" onclick="editarEbook(${Number(p.id)})">Editar</button>
        <button class="comprar-btn" style="background:var(--pink)" onclick="abrirAulasAdmin(${Number(p.id)})">Aulas</button>
        <button class="comprar-btn" style="background:#4b3a78" onclick="alternarVisibilidade(${Number(p.id)})">${oculto ? "Mostrar" : "Ocultar"}</button>
        <button class="comprar-btn" style="background:rgba(255,62,127,0.85)" onclick="excluirEbook(${Number(p.id)})">Excluir</button>
      </span>
    </div>`;
  }).join("");
}

function editarEbook(id){
  const p = todosEbooks.find(x => x.id === id);
  if(!p) return;
  document.getElementById("aId").value = p.id;
  document.getElementById("aTitulo").value = p.titulo;
  document.getElementById("aCategoria").value = p.categoria || "";
  document.getElementById("aPreco").value = formatarPreco(p.preco);
  document.getElementById("aPrecoAntigo").value = p.preco_antigo ? formatarPreco(p.preco_antigo) : "";
  document.getElementById("adminMsg").textContent = "";
  document.getElementById("adminLista").style.display = "none";
  document.getElementById("adminEdicao").style.display = "block";
}

async function salvarEdicao(event){
  event.preventDefault();
  const msg = document.getElementById("adminMsg");
  const preco = paraNumero(document.getElementById("aPreco").value.trim());
  if(preco === null || preco <= 0){ msg.textContent = "Preço inválido."; return false; }

  msg.textContent = "Salvando...";
  const { data, error } = await supabaseClient.from("ebooks").update({
    titulo: document.getElementById("aTitulo").value.trim(),
    categoria: document.getElementById("aCategoria").value,
    preco,
    preco_antigo: paraNumero(document.getElementById("aPrecoAntigo").value.trim())
  }).eq("id", document.getElementById("aId").value).select();

  if(error || !data || data.length === 0){
    msg.textContent = error ? error.message : "Não foi possível salvar (sem permissão).";
    return false;
  }
  await carregarProdutos();
  mostrarAdminLista();
  document.getElementById("adminMsg").textContent = "Salvo ✓";
  return false;
}

async function alternarVisibilidade(id){
  const p = todosEbooks.find(x => x.id === id);
  if(!p) return;
  const msg = document.getElementById("adminMsg");
  const novoValor = p.ativo === false; // se estava oculto, volta a ser exibido
  msg.textContent = "Salvando...";

  const { data, error } = await supabaseClient
    .from("ebooks").update({ ativo: novoValor }).eq("id", id).select();
  if(error || !data || data.length === 0){
    msg.textContent = error ? error.message : "Não foi possível alterar (sem permissão).";
    return;
  }
  await carregarProdutos();
  mostrarAdminLista();
  document.getElementById("adminMsg").textContent = novoValor
    ? "Ebook de volta na loja ✓"
    : "Ebook oculto da loja ✓ (quem já comprou continua com acesso)";
}

async function excluirEbook(id){
  const p = todosEbooks.find(x => x.id === id);
  if(!p) return;
  const msg = document.getElementById("adminMsg");
  msg.textContent = "Verificando compras...";

  const { count, error: erroCount } = await supabaseClient
    .from("compras").select("id", { count: "exact", head: true })
    .eq("ebook_id", id).eq("status", "pago");
  if(erroCount){
    msg.textContent = "Não foi possível verificar as compras: " + erroCount.message;
    return;
  }
  if(count > 0){
    msg.textContent = `Não dá pra excluir: ${count} pessoa(s) já compraram. Use "Ocultar" pra tirar da loja sem tirar o acesso de quem pagou.`;
    return;
  }

  const ok = confirm(`Excluir "${p.titulo}" de vez?\n\nNinguém comprou ainda. Não dá pra desfazer.`);
  if(!ok){ msg.textContent = ""; return; }

  msg.textContent = "Excluindo...";

  const { data: atual } = await supabaseClient
    .from("ebooks").select("arquivo_path").eq("id", id).single();

  const { data, error } = await supabaseClient.from("ebooks").delete().eq("id", id).select();
  if(error || !data || data.length === 0){
    msg.textContent = error ? error.message : "Não foi possível excluir (sem permissão).";
    return;
  }

  if(atual?.arquivo_path){
    await supabaseClient.storage.from("ebooks-privados").remove([atual.arquivo_path]);
  }
  await carregarProdutos();
  mostrarAdminLista();
  document.getElementById("adminMsg").textContent = "Ebook excluído ✓";
}

// ============================================================
// AULAS EM VÍDEO (YouTube não listado)
// ============================================================
function youtubeId(url){
  try{
    const u = new URL(String(url).trim());
    let id = "";
    if(u.hostname.includes("youtu.be")){
      id = u.pathname.slice(1).split("/")[0];
    } else if(u.hostname.includes("youtube.com")){
      if(u.pathname === "/watch"){
        id = u.searchParams.get("v") || "";
      } else {
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
        if(m) id = m[2];
      }
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  }catch(_e){
    return null;
  }
}

// ---------- ADMIN: cadastrar / apagar aulas de um ebook ----------
async function abrirAulasAdmin(ebookId){
  const p = todosEbooks.find(x => x.id === ebookId);
  if(!p) return;
  document.getElementById("auEbookId").value = ebookId;
  document.getElementById("aulasAdminTitulo").textContent = "Aulas: " + p.titulo;
  document.getElementById("auMsg").textContent = "";
  document.getElementById("auTitulo").value = "";
  document.getElementById("auLink").value = "";
  document.getElementById("modalAulasAdmin").style.display = "flex";
  await listarAulasAdmin(ebookId);
}

function fecharAulasAdmin(){
  document.getElementById("modalAulasAdmin").style.display = "none";
}

async function listarAulasAdmin(ebookId){
  const area = document.getElementById("aulasAdminLista");
  area.innerHTML = `<p class="avatar-vazio">Carregando...</p>`;

  const { data, error } = await supabaseClient
    .from("aulas").select("id,titulo,video_url,ordem")
    .eq("ebook_id", ebookId).order("ordem", { ascending: true });

  if(error){
    area.innerHTML = `<p class="avatar-vazio">${esc(error.message)}</p>`;
    return;
  }

  const maior = data.reduce((m, a) => Math.max(m, a.ordem || 0), 0);
  document.getElementById("auOrdem").value = maior + 1;

  if(data.length === 0){
    area.innerHTML = `<p class="avatar-vazio">Nenhuma aula cadastrada ainda.</p>`;
    return;
  }
  area.innerHTML = data.map(a => `
    <div class="item-comprado" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
      <span style="flex:1;word-break:break-word">${Number(a.ordem)}. ${esc(a.titulo)}</span>
      <button class="comprar-btn" style="background:rgba(255,62,127,0.85)" onclick="excluirAula(${Number(a.id)})">Excluir</button>
    </div>`).join("");
}

async function adicionarAula(event){
  event.preventDefault();
  const msg = document.getElementById("auMsg");
  const ebookId = Number(document.getElementById("auEbookId").value);
  const link = document.getElementById("auLink").value.trim();

  if(!youtubeId(link)){
    msg.textContent = "Link inválido. Cole o link do vídeo do YouTube (youtube.com/watch?v=... ou youtu.be/...).";
    return false;
  }

  msg.textContent = "Salvando...";
  const { error } = await supabaseClient.from("aulas").insert([{
    ebook_id: ebookId,
    titulo: document.getElementById("auTitulo").value.trim(),
    video_url: link,
    ordem: parseInt(document.getElementById("auOrdem").value, 10) || 1
  }]);

  if(error){
    msg.textContent = error.message;
    return false;
  }
  document.getElementById("auTitulo").value = "";
  document.getElementById("auLink").value = "";
  msg.textContent = "Aula adicionada ✓";
  await listarAulasAdmin(ebookId);
  return false;
}

async function excluirAula(id){
  if(!confirm("Excluir esta aula?")) return;
  const msg = document.getElementById("auMsg");
  const ebookId = Number(document.getElementById("auEbookId").value);
  msg.textContent = "Excluindo...";

  const { data, error } = await supabaseClient.from("aulas").delete().eq("id", id).select();
  if(error || !data || data.length === 0){
    msg.textContent = error ? error.message : "Não foi possível excluir (sem permissão).";
    return;
  }
  msg.textContent = "Aula excluída ✓";
  await listarAulasAdmin(ebookId);
}

// ---------- QUEM COMPROU: assistir ----------
let aulasAtuais = [];

async function abrirAulas(ebookId, titulo){
  const lista = document.getElementById("aulasLista");
  document.getElementById("aulasTitulo").textContent = "Aulas: " + titulo;
  document.getElementById("playerWrap").innerHTML = "";
  lista.innerHTML = `<p class="avatar-vazio">Carregando...</p>`;
  document.getElementById("modalAulas").style.display = "flex";

  const { data, error } = await supabaseClient
    .from("aulas").select("id,titulo,video_url,ordem")
    .eq("ebook_id", ebookId).order("ordem", { ascending: true });

  if(error || !data || data.length === 0){
    aulasAtuais = [];
    lista.innerHTML = `<p class="avatar-vazio">Ainda não há aulas neste ebook.</p>`;
    return;
  }

  aulasAtuais = data;
  lista.innerHTML = data.map((a, i) =>
    `<button type="button" class="aula-item" data-i="${i}">${i + 1}. ${esc(a.titulo)}</button>`
  ).join("");
  tocarAula(0);
}

function tocarAula(i){
  const a = aulasAtuais[i];
  if(!a) return;
  const wrap = document.getElementById("playerWrap");
  const id = youtubeId(a.video_url);

  document.querySelectorAll("#aulasLista .aula-item").forEach((el, n) => {
    el.classList.toggle("ativa", n === i);
  });

  if(!id){
    wrap.innerHTML = "";
    document.getElementById("aulasLista").insertAdjacentHTML("afterbegin",
      `<p class="avatar-vazio">O link desta aula está inválido.</p>`);
    return;
  }
  wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0"
    title="${esc(a.titulo)}"
    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

function fecharAulas(){
  document.getElementById("playerWrap").innerHTML = ""; // para o vídeo
  document.getElementById("modalAulas").style.display = "none";
}

document.getElementById("aulasLista").addEventListener("click", (e) => {
  const item = e.target.closest(".aula-item");
  if(item) tocarAula(Number(item.dataset.i));
});

console.log("Império dos Ebooks carregado!");