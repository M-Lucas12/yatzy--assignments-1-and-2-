// === Dice Module (Lab 6 base; 6 dice; holds) ===
export class Dice {
    constructor(numDice = 6){
        this.numDice = numDice;
        this.values = Array(numDice).fill(1);
        this.held   = Array(numDice).fill(false);
    }

    roll(){
        for(let i=0;i<this.numDice;i++){
            if(!this.held[i]){
                this.values[i] = Math.floor(Math.random()*6) + 1;
            }
        }
        return this.values;
    }

    toggleHold(index){
        if(index < 0 || index >= this.numDice) return;
        this.held[index] = !this.held[index];
    }

    releaseAll(){
        this.held = this.held.map(()=>false);
    }
}