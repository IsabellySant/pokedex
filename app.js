// ======================================
// DADOS
// ======================================

const POKEMON_DATA = [
{
id:25,
name:"pikachu",
height:4,
weight:60,
sprites:{
front_default:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
},
types:[
{
type:{name:"electric"}
}
],
abilities:[
{
ability:{name:"static"}
},
{
ability:{name:"lightning-rod"}
}
],
stats:[
{
stat:{name:"hp"},
base_stat:35
},
{
stat:{name:"attack"},
base_stat:55
},
{
stat:{name:"defense"},
base_stat:40
},
{
stat:{name:"speed"},
base_stat:90
}
]
},

{
id:1,
name:"bulbasaur",
height:7,
weight:69,
sprites:{
front_default:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
},
types:[
{
type:{name:"grass"}
},
{
type:{name:"poison"}
}
],
abilities:[
{
ability:{name:"overgrow"}
}
],
stats:[
{
stat:{name:"hp"},
base_stat:45
},
{
stat:{name:"attack"},
base_stat:49
},
{
stat:{name:"defense"},
base_stat:49
},
{
stat:{name:"speed"},
base_stat:45
}
]
},

{
id:4,
name:"charmander",
height:6,
weight:85,
sprites:{
front_default:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png"
},
types:[
{
type:{name:"fire"}
}
],
abilities:[
{
ability:{name:"blaze"}
}
],
stats:[
{
stat:{name:"hp"},
base_stat:39
},
{
stat:{name:"attack"},
base_stat:52
},
{
stat:{name:"defense"},
base_stat:43
},
{
stat:{name:"speed"},
base_stat:65
}
]
}
];

// ======================================
// ELEMENTOS
// ======================================

const pokemonGrid =
document.getElementById("pokemonGrid");

const pokemonCount =
document.getElementById("pokemonCount");

const detailPanel =
document.getElementById("detailPanel");

const searchInput =
document.getElementById("searchInput");

const clearFiltersBtn =
document.getElementById("clearFiltersBtn");

const favoritesBtn =
document.getElementById("favoritesBtn");

// ======================================
// FAVORITOS
// ======================================

function getFavorites(){

return JSON.parse(
localStorage.getItem("favoritos")
) || [];

}

function saveFavorites(lista){

localStorage.setItem(
"favoritos",
JSON.stringify(lista)
);

}

// ======================================
// RENDER
// ======================================

function renderPokemon(lista){

pokemonGrid.innerHTML = "";

pokemonCount.textContent =
`${lista.length} Pokémon encontrados`;

const favoritos =
getFavorites();

lista.forEach(pokemon=>{

const card =
document.createElement("div");

card.classList.add("card");

const tipoPrincipal =
pokemon.types[0]?.type?.name;

if(tipoPrincipal){

card.classList.add(tipoPrincipal);

}

const favorito =
favoritos.includes(
pokemon.id
);

card.innerHTML = `

<div class="card-number">
#${pokemon.id
.toString()
.padStart(3,"0")}
</div>

<img
src="${pokemon.sprites.front_default}"
alt="${pokemon.name}"
>

<div class="card-name">
${pokemon.name}
</div>

<div>
${pokemon.types
.map(t=>t.type.name)
.join(", ")}
</div>

<div class="favorite ${
favorito ? "active" : ""
}">
❤
</div>

`;

card.addEventListener(
"click",
()=>{

document
.querySelectorAll(".card")
.forEach(c=>
c.classList.remove("active")
);

card.classList.add(
"active"
);

mostrarDetalhes(
pokemon
);

}
);

const favBtn =
card.querySelector(
".favorite"
);

favBtn.addEventListener(
"click",
(e)=>{

e.stopPropagation();

let favoritos =
getFavorites();

if(
favoritos.includes(
pokemon.id
)
){

favoritos =
favoritos.filter(
id=>id !== pokemon.id
);

favBtn.classList.remove(
"active"
);

}else{

favoritos.push(
pokemon.id
);

favBtn.classList.add(
"active"
);

}

saveFavorites(
favoritos
);

}
);

pokemonGrid.appendChild(
card
);

});

}

// ======================================
// DETALHES
// ======================================

function mostrarDetalhes(
pokemon
){

const notaSalva =
localStorage.getItem(
`note-${pokemon.id}`
) || "";

detailPanel.innerHTML = `

<img
class="detail-image"
src="${pokemon.sprites.front_default}"
alt="${pokemon.name}"
>

<div class="detail-name">
${pokemon.name}
</div>

<div class="detail-id">
#${pokemon.id}
</div>

<div class="info-row">

<div class="info-title">
Altura
</div>

<strong>
${pokemon.height}
</strong>

</div>

<div class="info-row">

<div class="info-title">
Peso
</div>

<strong>
${pokemon.weight}
</strong>

</div>

<div class="info-row">

<div class="info-title">
Tipos
</div>

<div class="badges">

${pokemon.types.map(tipo=>`

<span
class="badge ${tipo.type.name}"
>

${tipo.type.name}

</span>

`).join("")}

</div>

</div>

<div class="info-row">

<div class="info-title">
Habilidades
</div>

${pokemon.abilities
.map(
a=>a.ability.name
)
.join(", ")}

</div>

<div class="info-row">

<div class="info-title">
Status Base
</div>

${pokemon.stats.map(stat=>`

<div class="move">

<strong>
${stat.stat.name}
</strong>

: ${stat.base_stat}

</div>

`).join("")}

</div>

<div class="info-row">

<div class="info-title">
Anotações
</div>

<textarea
id="pokemonNote"
placeholder="Escreva observações..."
>${notaSalva}</textarea>

<button id="saveNote">
Salvar
</button>

</div>

`;

const saveBtn =
document.getElementById(
"saveNote"
);

saveBtn.addEventListener(
"click",
()=>{

const texto =
document.getElementById(
"pokemonNote"
).value;

localStorage.setItem(
`note-${pokemon.id}`,
texto
);

saveBtn.textContent =
"Salvo ✓";

setTimeout(()=>{

saveBtn.textContent =
"Salvar";

},1000);

}
);

}

// ======================================
// BUSCA
// ======================================

searchInput.addEventListener(
"input",
()=>{

const termo =
searchInput.value
.toLowerCase();

const filtrados =
POKEMON_DATA.filter(
pokemon=>
pokemon.name
.toLowerCase()
.includes(termo)
);

renderPokemon(
filtrados
);

}
);

// ======================================
// LIMPAR
// ======================================

clearFiltersBtn.addEventListener(
"click",
()=>{

searchInput.value = "";

renderPokemon(
POKEMON_DATA
);

}
);

// ======================================
// FAVORITOS
// ======================================

favoritesBtn.addEventListener(
"click",
()=>{

const favoritos =
getFavorites();

const lista =
POKEMON_DATA.filter(
pokemon=>
favoritos.includes(
pokemon.id
)
);

renderPokemon(lista);

}
);

// ======================================
// INICIAR
// ======================================

renderPokemon(
POKEMON_DATA
);

mostrarDetalhes(
POKEMON_DATA[0]
);