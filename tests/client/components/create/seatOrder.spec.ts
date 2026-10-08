import {expect} from 'chai';
import {arrangeSeats} from '@/client/components/create/seatOrder';
import {NewPlayerModel} from '@/common/game/NewGameConfig';
import {Color} from '@/common/Color';

function seat(name: string, color: Color, aiLevel?: 'normal' | 'hard'): NewPlayerModel {
  return {name, color, beginner: false, handicap: 0, first: false, aiLevel};
}

describe('seatOrder', () => {
  it('puts humans before AI players', () => {
    const players = [seat('Claude', 'orange', 'normal'), seat('Jens', 'blue'), seat('', 'red')];
    const arranged = arrangeSeats(players, 2, 1, 1);
    expect(arranged.map((p) => p.name)).deep.eq(['Jens', 'Claude', '']);
  });

  it('adds a new human between the humans and the AI players', () => {
    const players = [seat('Jens', 'blue'), seat('Claude', 'orange', 'hard'), seat('', 'red')];
    const arranged = arrangeSeats(players, 2, 2, 1);
    expect(arranged.map((p) => p.name)).deep.eq(['Jens', '', 'Claude']);
    expect(arranged[1].aiLevel).is.undefined;
    expect(arranged[2].aiLevel).eq('hard');
  });

  it('brings a removed seat back when it is added again', () => {
    const players = [seat('Jens', 'blue'), seat('Daniel', 'green'), seat('Claude', 'orange', 'normal'), seat('', 'red')];
    const fewer = arrangeSeats(players, 3, 1, 1);
    expect(fewer.slice(0, 2).map((p) => p.name)).deep.eq(['Jens', 'Claude']);
    const again = arrangeSeats(fewer, 2, 2, 1);
    expect(again.slice(0, 3).map((p) => p.name)).deep.eq(['Jens', 'Daniel', 'Claude']);
  });
});
