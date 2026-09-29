import sqlite3,json,time
c=sqlite3.connect('db/game.db')
sid,raw=c.execute("select save_id,game from games order by save_id desc limit 1").fetchone()
g=json.loads(raw)
J,M=g['players']
jid,mid=J['id'],M['id']
def pc(n,r=0): return {'name':n,'resourceCount':r,'isDisabled':False}
def res(p,vals):
  for k,(v,pr) in zip(['megaCredits','steel','titanium','plants','energy','heat'],vals):
    p[k]=v; p[('megaCreditProduction' if k=='megaCredits' else k+'Production')]=pr
res(J,[(46,9),(6,2),(4,2),(9,3),(3,3),(8,4)])
res(M,[(41,11),(3,3),(1,1),(3,2),(1,2),(4,2)])
J['terraformRating']=31; M['terraformRating']=28
J['playedCards']=[pc('Saturn Systems'),pc('Space Elevator'),pc('Development Center'),pc('Mars University'),pc('Pets',4),pc('Arctic Algae'),pc('Tardigrades',7),pc('Ganymede Colony'),pc('Power Plant')]
J['cardsInHand']=['Domed Crater','Fueled Generators','Special Design','Lunar Beam','Adapted Lichen','Comet','Research']
M['playedCards']=[pc('Teractor'),pc('Asteroid'),pc('Big Asteroid'),pc('Ironworks'),pc('Mine'),pc('Ice Asteroid'),pc('Power Plant'),pc('Search For Life',2)]
M['cardsInHand']=['Breathing Filters','Deep Well Heating','ArchaeBacteria','Immigrant City','Kelp Farming']
for p in (J,M): p['actionsTakenThisRound']=0
g['generation']=6; g['temperature']=-16; g['oxygenLevel']=5
tiles={'32':(1,None),'33':(1,None),'34':(1,None),'28':(1,None),'24':(2,jid),'36':(2,jid),'23':(0,jid),'25':(0,jid),'35':(0,jid),'47':(2,mid),'46':(0,mid),'40':(0,mid)}
for s in g['board']['spaces']:
  if s['id'] in tiles:
    t,o=tiles[s['id']]; s['tile']={'tileType':t}
    if o: s['player']=o
ts=int(time.time()*1000)
g['gameLog'].append({'message':'Generation ${0}','data':[{'type':1,'value':'6'}],'timestamp':ts,'type':1})
for col,card in [('red','Big Asteroid'),('green','Ganymede Colony'),('red','Ice Asteroid'),('green','Pets'),('red','Search For Life'),('green','Power Plant')]:
  g['gameLog'].append({'message':'${0} played ${1}','data':[{'type':2,'value':col},{'type':3,'value':card}],'timestamp':ts})
c.execute("update games set game=? where save_id=? and game_id=?",(json.dumps(g),sid,g['id'])); c.commit()
print('ok',sid)
