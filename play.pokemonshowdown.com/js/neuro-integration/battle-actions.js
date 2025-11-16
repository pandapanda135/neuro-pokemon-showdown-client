"use strict";function _inheritsLoose(t,o){t.prototype=Object.create(o.prototype),t.prototype.constructor=t,_setPrototypeOf(t,o);}function _setPrototypeOf(t,e){return _setPrototypeOf=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t;},_setPrototypeOf(t,e);}var







SelectMove=function(_NeuroAction){






function SelectMove(){
var schema={type:'object',properties:{move:{type:'string',"enum":SelectMove.getActiveMoves()}},required:["move"]};return(
_NeuroAction.call(this,"select_move","Select a move to use",schema))||this;
}_inheritsLoose(SelectMove,_NeuroAction);var _proto=SelectMove.prototype;_proto.Validation=function Validation(data){throw new Error("Method not implemented.");};_proto.Execute=function Execute(data){throw new Error("Method not implemented.");};SelectMove.

getActiveMoves=function getActiveMoves(){
console.log("running active moves");
if(PS===undefined||PS.rooms===undefined)return[];

for(var roomID in PS.rooms){
console.log("room id: "+roomID);
if(!PS.rooms[roomID])continue;
console.log("room name: "+PS.rooms[roomID].id+"    type:"+PS.rooms[roomID].type);
console.log("room"+printObj(PS.rooms[roomID]));
}

var room=PS.rooms["battle"]||null;
if(room===null||room.battle.myPokemon===null)return[];
return room.battle.myPokemon[0].moves;
};return SelectMove;}(NeuroAction);var


SwapPokemon=function(_NeuroAction2){






function SwapPokemon(){
var schema={type:'object',properties:{pokemon:{type:'string',"enum":SwapPokemon.getPossiblePokemon()}},required:["pokemon"]};return(
_NeuroAction2.call(this,"swap_pokemon","Change what pokemon is currently active.",schema))||this;
}_inheritsLoose(SwapPokemon,_NeuroAction2);var _proto2=SwapPokemon.prototype;_proto2.Validation=function Validation(data){throw new Error("Method not implemented.");};_proto2.Execute=function Execute(data){throw new Error("Method not implemented.");};SwapPokemon.

getPossiblePokemon=function getPossiblePokemon(){
if(PS===undefined||PS.rooms===undefined)return[];

for(var roomID in PS.rooms){
console.log("room id: "+roomID);
console.log("room"+PS.rooms[roomID]);
}

var room=PS.rooms["battle"]||null;
if(room===null||room.battle.myPokemon===null)return[];
var pokemonNames=[];for(var _i2=0,_room$battle$myPokemo2=
room.battle.myPokemon;_i2<_room$battle$myPokemo2.length;_i2++){var pokemon=_room$battle$myPokemo2[_i2];
pokemonNames.push(pokemon.name);
}
return pokemonNames;
};return SwapPokemon;}(NeuroAction);
//# sourceMappingURL=battle-actions.js.map