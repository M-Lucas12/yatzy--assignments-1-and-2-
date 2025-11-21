// === Yatzy Engine Module (Lab 6) ===
export class YatzyEngine {
    sum(d){ return d.reduce((a,b)=>a+b,0); }
    counts(d){
        const c = {1:0,2:0,3:0,4:0,5:0,6:0};
        for(const v of d) c[v]++;
        return c;
    }

    // Upper section
    ones(d){return d.filter(v=>v===1).length*1;}
    twos(d){return d.filter(v=>v===2).length*2;}
    threes(d){return d.filter(v=>v===3).length*3;}
    fours(d){return d.filter(v=>v===4).length*4;}
    fives(d){return d.filter(v=>v===5).length*5;}
    sixes(d){return d.filter(v=>v===6).length*6;}

    isThreeKind(d){ return Math.max(...Object.values(this.counts(d)))>=3; }
    isFourKind(d){  return Math.max(...Object.values(this.counts(d)))>=4; }
    isFullHouse(d){
        const cs = Object.values(this.counts(d));
        return cs.includes(3) && cs.includes(2);
    }
    isSmallStraight(d){
        const s = [...new Set(d)].sort().join('');
        return s.includes('1234') || s.includes('2345') || s.includes('3456');
    }
    isLargeStraight(d){
        const s = [...new Set(d)].sort().join('');
        return s === '12345' || s === '23456';
    }
    isYatzy(d){ return d.every(v=>v===d[0]); }

    score(category, dice){
        switch(category){
            case 'Ones': return this.ones(dice);
            case 'Twos': return this.twos(dice);
            case 'Threes': return this.threes(dice);
            case 'Fours': return this.fours(dice);
            case 'Fives': return this.fives(dice);
            case 'Sixes': return this.sixes(dice);
            case 'Three of a Kind': return this.isThreeKind(dice) ? this.sum(dice) : 0;
            case 'Four of a Kind':  return this.isFourKind(dice)  ? this.sum(dice) : 0;
            case 'Full House':      return this.isFullHouse(dice) ? 25 : 0;
            case 'Small Straight':  return this.isSmallStraight(dice) ? 30 : 0;
            case 'Large Straight':  return this.isLargeStraight(dice) ? 40 : 0;
            case 'Chance':          return this.sum(dice);
            case 'Yatzy':           return this.isYatzy(dice) ? 50 : 0;
            default: return 0;
        }
    }
}