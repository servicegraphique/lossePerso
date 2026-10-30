# -*- coding: utf-8 -*-
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

INK="101F2B"; INPUT="FFF2CC"; CALC="EDEDED"; ACCENT="B8432A"; TEAL="DCEFE9"
thin=Side(style="thin", color="D9D4CA"); box=Border(left=thin,right=thin,top=thin,bottom=thin)
MGA='#,##0 "Ar"'; EUR='#,##0 "€"'; PCT='0.0%'; NUM='#,##0'; MOIS='0.0 "mois"'

wb=Workbook()
OUT={}

def title(ws,text,sub=""):
    ws.merge_cells("A1:F1"); c=ws["A1"]; c.value=text
    c.font=Font(bold=True,size=16,color="FFFFFF"); c.fill=PatternFill("solid",fgColor=INK)
    c.alignment=Alignment(vertical="center",horizontal="left",indent=1); ws.row_dimensions[1].height=34
    if sub:
        ws.merge_cells("A2:F2"); ws["A2"]=sub
        ws["A2"].font=Font(italic=True,size=9,color="5C6B76"); ws["A2"].alignment=Alignment(indent=1)

def section(ws,row,text):
    ws.merge_cells(start_row=row,start_column=1,end_row=row,end_column=6)
    c=ws.cell(row=row,column=1,value=text)
    c.font=Font(bold=True,size=10,color="FFFFFF"); c.fill=PatternFill("solid",fgColor=ACCENT)
    c.alignment=Alignment(indent=1,vertical="center"); ws.row_dimensions[row].height=22
    return row+1

def inp(ws,row,label,value,fmt=None,note="",R=None,key=None):
    a=ws.cell(row=row,column=1,value=label); a.font=Font(size=10)
    b=ws.cell(row=row,column=2,value=value)
    b.fill=PatternFill("solid",fgColor=INPUT); b.font=Font(bold=True,size=10); b.border=box
    b.alignment=Alignment(horizontal="right")
    if fmt: b.number_format=fmt
    if note:
        n=ws.cell(row=row,column=3,value=note); n.font=Font(size=8,italic=True,color="7A8791")
    if R is not None and key: R[key]=row
    return row+1

def calc(ws,row,label,formula,fmt=None,bold=False,fill=CALC,note=""):
    a=ws.cell(row=row,column=1,value=label); a.font=Font(size=10,bold=bold)
    b=ws.cell(row=row,column=2,value=formula)
    b.fill=PatternFill("solid",fgColor=fill); b.border=box
    b.font=Font(bold=bold,size=10); b.alignment=Alignment(horizontal="right")
    if fmt: b.number_format=fmt
    if note:
        n=ws.cell(row=row,column=3,value=note); n.font=Font(size=8,italic=True,color="7A8791")
    return row+1

def widths(ws,w=(52,18,46,12,12,12)):
    for i,x in enumerate(w,start=1): ws.column_dimensions[get_column_letter(i)].width=x

def head_row(ws,row,heads):
    for j,h in enumerate(heads,start=1):
        c=ws.cell(row=row,column=j,value=h)
        c.font=Font(bold=True,size=9,color="FFFFFF"); c.fill=PatternFill("solid",fgColor=INK)
        c.alignment=Alignment(wrap_text=True,vertical="center")
    return row+1

# ---------- LISEZ-MOI ----------
ws=wb.active; ws.title="Lisez-moi"
title(ws,"MODÈLE FINANCIER — 5 business à Antananarivo (2026)",
      "Compagnon du rapport RAPPORT.html · toutes les cellules jaunes sont modifiables")
widths(ws,(46,22,62,10,10,10))
r=4; r=section(ws,r,"MODE D'EMPLOI")
for t in ["1. Cellules jaunes = hypothèses à adapter à votre situation.",
          "2. Cellules grises = calculs automatiques (ne pas saisir).",
          "3. Chaque onglet est indépendant : modifiez volumes, prix et charges, tout se recalcule.",
          "4. Montants mensuels, hors impôts (impôt synthétique 5 % ou IR 20 %).",
          "5. Les résultats sont des estimations de travail, pas des garanties."]:
    ws.merge_cells(start_row=r,start_column=1,end_row=r,end_column=3)
    ws.cell(row=r,column=1,value=t).font=Font(size=10); r+=1
r+=1; r=section(ws,r,"LES 5 MODÈLES")
for name,cap,desc,sheet in [
 ("A — Micro-agence numérique à l'export","Capital 1,5 M Ar","Facturation en euros, marge nette 50-65 %","A-Numerique"),
 ("B — Achats groupés de quartier","Capital 0-1 M Ar","Précommande + mobile money, marge 6-10 % du GMV","B-Achats"),
 ("C — Logistique urbaine B2B","Capital 5-15 M Ar","Coursier moto, abonnements entreprises","C-Logistique"),
 ("D — Eau : abonnement et kiosque","Capital 4,5-12 M Ar","Bonbonnes 20 L, contrats bureaux","D-Eau"),
 ("E — Froid & solaire","Capital 3-5 M Ar","Installation + maintenance, acompte client","E-Solaire")]:
    ws.cell(row=r,column=1,value=name).font=Font(bold=True,size=10)
    ws.cell(row=r,column=2,value=cap).font=Font(size=10)
    ws.cell(row=r,column=3,value=desc).font=Font(size=9,color="5C6B76")
    ws.cell(row=r,column=5,value=sheet).font=Font(size=9,bold=True,color="0D6A5B")
    r+=1
r+=1; r=section(ws,r,"RAPPELS DE COÛTS 2026 (à vérifier avant usage)")
for lab,val in [("Taux de change de travail","1 € = 4 800 Ar"),("SMIG","300 000 Ar/mois"),
                ("Charges patronales CNaPS","≈ 13 %"),("Carburant SP95 / gasoil","5 300 / 4 860 Ar par litre"),
                ("Impôt synthétique / IR","5 % du CA / 20 % du bénéfice"),
                ("TVA","20 % (seuil à confirmer auprès de la DGI)"),
                ("Microfinance","1,3 à 2,5 % par mois"),("Taux directeur BFM","12 %")]:
    ws.cell(row=r,column=1,value=lab).font=Font(size=10)
    ws.cell(row=r,column=2,value=val).font=Font(size=10,bold=True); r+=1

# ---------- PARAMETRES ----------
ws=wb.create_sheet("Paramètres")
title(ws,"Paramètres généraux","Ces valeurs alimentent les autres onglets")
widths(ws); r=4; r=section(ws,r,"HYPOTHÈSES COMMUNES")
P={}
r=inp(ws,r,"Taux de change (Ar pour 1 €)",4800,'#,##0',"à réactualiser chaque mois",P,"fx")
r=inp(ws,r,"Jours d'activité par mois",26,'0',"",P,"jours")
r=inp(ws,r,"Charges sociales patronales (CNaPS)",0.13,PCT,"",P,"cnaps")
r=inp(ws,r,"Impôt synthétique (information)",0.05,PCT,"non déduit dans les calculs",P,"impot")
FX=f"Paramètres!$B${P['fx']}"

# ---------- A NUMERIQUE ----------
ws=wb.create_sheet("A-Numerique")
title(ws,"PLAN A — Micro-agence numérique à l'export","Vendre en euros une compétence produite à coût local")
widths(ws); r=4; r=section(ws,r,"HYPOTHÈSES (à modifier)"); A={}
for lab,val,fmt,note,key in [
 ("Clients en abonnement",2,'0',"objectif à 6 mois","cli"),
 ("Prix moyen de l'abonnement (€/mois/client)",750,EUR,"marché : 700-1 200 €","prix"),
 ("Projets ponctuels par mois",1,'0.0',"","prj"),
 ("Prix moyen d'un projet (€)",400,EUR,"moyenne lissée","prj_prix"),
 ("Salaire du fondateur (Ar)",1200000,MGA,"","sal1"),
 ("Salaire d'un développeur (Ar)",900000,MGA,"profil confirmé","sal2"),
 ("Nombre de développeurs",1,'0',"","ndev"),
 ("Charges sociales",0.13,PCT,"","cs"),
 ("Internet + sauvegarde électrique (Ar)",400000,MGA,"onduleur / solaire","net"),
 ("Outils logiciels (Ar)",250000,MGA,"GitHub, Figma, hébergement, IA","outils"),
 ("Prospection et marketing (Ar)",300000,MGA,"","mkt"),
 ("Comptabilité, banque, divers (Ar)",200000,MGA,"","adm"),
 ("Investissement initial (Ar)",1500000,MGA,"hors ordinateurs déjà possédés","inv")]:
    r=inp(ws,r,lab,val,fmt,note,A,key)
r+=1; r=section(ws,r,"RÉSULTATS (calculés)")
ca_eur=r; r=calc(ws,r,"Chiffre d'affaires mensuel (€)",f"=B{A['cli']}*B{A['prix']}+B{A['prj']}*B{A['prj_prix']}",EUR,True)
ca=r; r=calc(ws,r,"Chiffre d'affaires mensuel (Ar)",f"=B{ca_eur}*{FX}",MGA,True)
sal=r; r=calc(ws,r,"Charges salariales",f"=(B{A['sal1']}+B{A['sal2']}*B{A['ndev']})*(1+B{A['cs']})",MGA)
aut=r; r=calc(ws,r,"Autres charges",f"=B{A['net']}+B{A['outils']}+B{A['mkt']}+B{A['adm']}",MGA)
tot=r; r=calc(ws,r,"Total des charges",f"=B{sal}+B{aut}",MGA,True)
net=r; r=calc(ws,r,"RÉSULTAT NET MENSUEL",f"=B{ca}-B{tot}",MGA,True,TEAL)
mrg=r; r=calc(ws,r,"Marge nette",f"=IF(B{ca}=0,0,B{net}/B{ca})",PCT,True)
r=calc(ws,r,"Seuil de rentabilité (€ / mois)",f"=B{tot}/{FX}",EUR,True)
pb=r; r=calc(ws,r,"Retour sur investissement",f"=IF(B{net}>0,B{A['inv']}/B{net},\"non rentable\")",MOIS,True)
r=calc(ws,r,"Chiffre d'affaires annualisé",f"=B{ca}*12",MGA)
r=calc(ws,r,"Résultat net annualisé",f"=B{net}*12",MGA)
OUT["A"]=dict(inv=A['inv'],net=net,marge=mrg,pb=pb)
r+=1; r=section(ws,r,"SENSIBILITÉ — nombre de clients en abonnement")
r=head_row(ws,r,["Clients","CA mensuel (€)","CA mensuel (Ar)","Charges (Ar)","Résultat net (Ar)","Marge"])
for clients in [1,2,3,4,5]:
    ws.cell(row=r,column=1,value=clients).border=box
    ws.cell(row=r,column=2,value=f"=A{r}*B{A['prix']}+B{A['prj']}*B{A['prj_prix']}").number_format=EUR
    ws.cell(row=r,column=3,value=f"=B{r}*{FX}").number_format=MGA
    ws.cell(row=r,column=4,value=f"=B{tot}").number_format=MGA
    ws.cell(row=r,column=5,value=f"=C{r}-D{r}").number_format=MGA
    ws.cell(row=r,column=6,value=f"=IF(C{r}=0,0,E{r}/C{r})").number_format=PCT
    for j in range(1,7): ws.cell(row=r,column=j).border=box
    r+=1

# ---------- B ACHATS ----------
ws=wb.create_sheet("B-Achats")
title(ws,"PLAN B — Achats groupés de quartier","Précommande payée → achat groupé → livraison hebdomadaire")
widths(ws); r=4; r=section(ws,r,"HYPOTHÈSES (à modifier)"); B={}
for lab,val,fmt,note,key in [
 ("Panier moyen par commande (Ar)",90000,MGA,"riz 25 kg + huile + sucre","panier"),
 ("Clients actifs",250,'0',"","clients"),
 ("Commandes par client et par mois",1.5,'0.0',"","freq"),
 ("Marge brute moyenne",0.08,PCT,"riz 5-7 %, gaz 10-12 %","marge"),
 ("Assistant (Ar)",400000,MGA,"","assist"),
 ("Transport et manutention (Ar)",250000,MGA,"camion loué à la journée","transp"),
 ("Emballage et impression (Ar)",80000,MGA,"","emb"),
 ("Marketing et parrainage (Ar)",150000,MGA,"","mkt"),
 ("Téléphone, data, frais mobile money (Ar)",60000,MGA,"","tel"),
 ("Investissement initial (Ar)",500000,MGA,"sacs, balance, enseigne","inv")]:
    r=inp(ws,r,lab,val,fmt,note,B,key)
r+=1; r=section(ws,r,"RÉSULTATS")
gmv=r; r=calc(ws,r,"Volume d'affaires mensuel (GMV)",f"=B{B['panier']}*B{B['clients']}*B{B['freq']}",MGA,True)
cmde=r; r=calc(ws,r,"Nombre de commandes par mois",f"=B{B['clients']}*B{B['freq']}",NUM)
mbr=r; r=calc(ws,r,"Marge brute",f"=B{gmv}*B{B['marge']}",MGA,True)
fix=r; r=calc(ws,r,"Charges fixes",f"=B{B['assist']}+B{B['transp']}+B{B['emb']}+B{B['mkt']}+B{B['tel']}",MGA)
net=r; r=calc(ws,r,"RÉSULTAT NET MENSUEL",f"=B{mbr}-B{fix}",MGA,True,TEAL)
mrg=r; r=calc(ws,r,"Marge nette (en % du GMV)",f"=IF(B{gmv}=0,0,B{net}/B{gmv})",PCT,True)
beg=r; r=calc(ws,r,"Seuil de rentabilité (GMV mensuel)",f"=IF(B{B['marge']}=0,0,B{fix}/B{B['marge']})",MGA,True)
r=calc(ws,r,"Soit un nombre de commandes",f"=IF(B{B['panier']}=0,0,B{beg}/B{B['panier']})",NUM,True)
pb=r; r=calc(ws,r,"Retour sur investissement",f"=IF(B{net}>0,B{B['inv']}/B{net},\"non rentable\")",MOIS,True)
OUT["B"]=dict(inv=B['inv'],net=net,marge=mrg,pb=pb)
r+=1; r=section(ws,r,"SENSIBILITÉ — GMV mensuel")
r=head_row(ws,r,["GMV mensuel","Marge brute","Charges fixes","Résultat net"])
for g in [10000000,20000000,33750000,60000000,100000000]:
    ws.cell(row=r,column=1,value=g).number_format=MGA
    ws.cell(row=r,column=2,value=f"=A{r}*B{B['marge']}").number_format=MGA
    ws.cell(row=r,column=3,value=f"=B{fix}").number_format=MGA
    ws.cell(row=r,column=4,value=f"=B{r}-C{r}").number_format=MGA
    for j in range(1,5): ws.cell(row=r,column=j).border=box
    r+=1

# ---------- C LOGISTIQUE ----------
ws=wb.create_sheet("C-Logistique")
title(ws,"PLAN C — Logistique urbaine B2B","Coursier moto, abonnements restaurants et e-commerçants")
widths(ws); r=4; r=section(ws,r,"HYPOTHÈSES (à modifier)"); C={}
for lab,val,fmt,note,key in [
 ("Nombre de motos",3,'0',"démarrer avec 1 si le carnet est vide","motos"),
 ("Courses par moto et par jour",20,'0',"maximum réaliste en circulation dense","courses"),
 ("Tarif moyen par course (Ar)",5000,MGA,"4 000-7 000 Ar intra-Tana","tarif"),
 ("Jours d'activité par mois",26,'0',"","jours"),
 ("Commission du livreur (% du CA, carburant inclus)",0.40,PCT,"standard du marché","comm"),
 ("Entretien par moto et par mois (Ar)",70000,MGA,"","entretien"),
 ("Assurance par moto et par mois (Ar)",25000,MGA,"","assur"),
 ("Superviseur / dispatch (Ar)",600000,MGA,"0 si vous dispatchez vous-même","superv"),
 ("Local et parking (Ar)",250000,MGA,"","local"),
 ("Marketing (Ar)",200000,MGA,"","mkt"),
 ("Administration (Ar)",150000,MGA,"","adm"),
 ("Prix d'une moto (Ar)",4250000,MGA,"","prix_moto"),
 ("Équipement par moto (Ar)",250000,MGA,"casque, caisse, immatriculation","equip"),
 ("Fonds de roulement (Ar)",1000000,MGA,"","fdr")]:
    r=inp(ws,r,lab,val,fmt,note,C,key)
r+=1; r=section(ws,r,"RÉSULTATS")
ca=r; r=calc(ws,r,"Chiffre d'affaires mensuel",f"=B{C['motos']}*B{C['courses']}*B{C['tarif']}*B{C['jours']}",MGA,True)
com=r; r=calc(ws,r,"Commissions des livreurs",f"=-B{ca}*B{C['comm']}",MGA)
ent=r; r=calc(ws,r,"Entretien + assurance",f"=-B{C['motos']}*(B{C['entretien']}+B{C['assur']})",MGA)
marg=r; r=calc(ws,r,"Marge sur coûts variables",f"=B{ca}+B{com}+B{ent}",MGA,True)
fixe=r; r=calc(ws,r,"Charges fixes",f"=B{C['superv']}+B{C['local']}+B{C['mkt']}+B{C['adm']}",MGA)
net=r; r=calc(ws,r,"RÉSULTAT NET MENSUEL",f"=B{marg}-B{fixe}",MGA,True,TEAL)
mrg=r; r=calc(ws,r,"Marge nette",f"=IF(B{ca}=0,0,B{net}/B{ca})",PCT,True)
inv=r; r=calc(ws,r,"Investissement total",f"=B{C['motos']}*(B{C['prix_moto']}+B{C['equip']})+B{C['fdr']}",MGA,True)
pb=r; r=calc(ws,r,"Retour sur investissement",f"=IF(B{net}>0,B{inv}/B{net},\"non rentable\")",MOIS,True)
OUT["C"]=dict(inv=inv,net=net,marge=mrg,pb=pb)
r+=1; r=section(ws,r,"SENSIBILITÉ — nombre de motos (superviseur activé à partir de 2 motos)")
r=head_row(ws,r,["Motos","CA mensuel","Marge variable","Charges fixes","Résultat net"])
for n in [1,2,3,4,6]:
    ws.cell(row=r,column=1,value=n).border=box
    ws.cell(row=r,column=2,value=f"=A{r}*B{C['courses']}*B{C['tarif']}*B{C['jours']}").number_format=MGA
    ws.cell(row=r,column=3,value=f"=B{r}*(1-B{C['comm']})-A{r}*(B{C['entretien']}+B{C['assur']})").number_format=MGA
    ws.cell(row=r,column=4,value=f"=B{C['local']}+B{C['mkt']}+B{C['adm']}+IF(A{r}>1,B{C['superv']},0)").number_format=MGA
    ws.cell(row=r,column=5,value=f"=C{r}-D{r}").number_format=MGA
    for j in range(1,6): ws.cell(row=r,column=j).border=box
    r+=1

# ---------- D EAU ----------
ws=wb.create_sheet("D-Eau")
title(ws,"PLAN D — Eau : abonnement et kiosque","Bonbonnes de 20 L, contrats bureaux, livraison à domicile")
widths(ws); r=4; r=section(ws,r,"HYPOTHÈSES (à modifier)"); D={}
for lab,val,fmt,note,key in [
 ("Bonbonnes livrées par jour",45,'0',"","liv"),
 ("Prix d'une bonbonne livrée (Ar)",2500,MGA,"sous le prix de crise (3 000 Ar)","prix_liv"),
 ("Bonbonnes vendues au kiosque par jour",15,'0',"","kiosq"),
 ("Prix au kiosque (Ar)",1500,MGA,"","prix_kiosq"),
 ("Jours d'activité par mois",26,'0',"","jours"),
 ("Coût variable par bonbonne (Ar)",350,MGA,"eau, filtres, UV, amortissement","cv"),
 ("Employé de production et livraison (Ar)",450000,MGA,"","emp"),
 ("Loyer du local (Ar)",350000,MGA,"20 à 30 m²","loyer"),
 ("Électricité et sauvegarde (Ar)",150000,MGA,"","elec"),
 ("Transport (moto cargo / tricycle) (Ar)",300000,MGA,"","transp"),
 ("Marketing et enseigne (Ar)",200000,MGA,"","mkt"),
 ("Investissement initial (Ar)",11500000,MGA,"filtration, cuves, 120 bonbonnes, véhicule","inv")]:
    r=inp(ws,r,lab,val,fmt,note,D,key)
r+=1; r=section(ws,r,"RÉSULTATS")
ca=r; r=calc(ws,r,"Chiffre d'affaires mensuel",f"=(B{D['liv']}*B{D['prix_liv']}+B{D['kiosq']}*B{D['prix_kiosq']})*B{D['jours']}",MGA,True)
vol=r; r=calc(ws,r,"Bonbonnes vendues par mois",f"=(B{D['liv']}+B{D['kiosq']})*B{D['jours']}",NUM)
cv=r; r=calc(ws,r,"Coûts variables",f"=B{vol}*B{D['cv']}",MGA)
mcv=r; r=calc(ws,r,"Marge sur coûts variables",f"=B{ca}-B{cv}",MGA,True)
fix=r; r=calc(ws,r,"Charges fixes",f"=B{D['emp']}+B{D['loyer']}+B{D['elec']}+B{D['transp']}+B{D['mkt']}",MGA)
net=r; r=calc(ws,r,"RÉSULTAT NET MENSUEL",f"=B{mcv}-B{fix}",MGA,True,TEAL)
mrg=r; r=calc(ws,r,"Marge nette",f"=IF(B{ca}=0,0,B{net}/B{ca})",PCT,True)
cu=r; r=calc(ws,r,"Contribution moyenne par bonbonne",f"=IF(B{vol}=0,0,B{mcv}/B{vol})",MGA,True)
r=calc(ws,r,"Seuil de rentabilité (bonbonnes par jour)",f"=IF(B{cu}=0,0,B{fix}/(B{cu}*B{D['jours']}))",'0.0',True)
pb=r; r=calc(ws,r,"Retour sur investissement",f"=IF(B{net}>0,B{D['inv']}/B{net},\"non rentable\")",MOIS,True)
OUT["D"]=dict(inv=D['inv'],net=net,marge=mrg,pb=pb)
r+=1; r=section(ws,r,"SENSIBILITÉ — volume quotidien (répartition 75 % livré / 25 % kiosque)")
r=head_row(ws,r,["Bonbonnes / jour","CA mensuel","Coûts variables","Charges fixes","Résultat net"])
for q in [20,40,60,80,100]:
    ws.cell(row=r,column=1,value=q).border=box
    ws.cell(row=r,column=2,value=f"=A{r}*(0.75*B{D['prix_liv']}+0.25*B{D['prix_kiosq']})*B{D['jours']}").number_format=MGA
    ws.cell(row=r,column=3,value=f"=A{r}*B{D['jours']}*B{D['cv']}").number_format=MGA
    ws.cell(row=r,column=4,value=f"=B{fix}").number_format=MGA
    ws.cell(row=r,column=5,value=f"=B{r}-C{r}-D{r}").number_format=MGA
    for j in range(1,6): ws.cell(row=r,column=j).border=box
    r+=1

# ---------- E SOLAIRE ----------
ws=wb.create_sheet("E-Solaire")
title(ws,"PLAN E — Froid & solaire","Installation, garantie et contrat de maintenance")
widths(ws); r=4; r=section(ws,r,"HYPOTHÈSES (à modifier)"); E={}
for lab,val,fmt,note,key in [
 ("Installations par mois",2,'0',"démarrer à 1","installs"),
 ("Prix moyen d'une installation (Ar)",14000000,MGA,"3 kW + batterie + congélateur","prix"),
 ("Coût du matériel (% du prix)",0.68,PCT,"panneaux, onduleur, batterie","mat"),
 ("Main-d'œuvre par installation (Ar)",400000,MGA,"","mo"),
 ("Nombre de techniciens",2,'0',"","ntech"),
 ("Salaire d'un technicien (Ar)",900000,MGA,"profil rare et cher","saltech"),
 ("Charges sociales",0.13,PCT,"","cs"),
 ("Local / showroom (Ar)",700000,MGA,"","local"),
 ("Marketing (Ar)",500000,MGA,"","mkt"),
 ("Administration (Ar)",300000,MGA,"","adm"),
 ("Investissement initial (Ar)",5000000,MGA,"outillage + kit de démonstration","inv")]:
    r=inp(ws,r,lab,val,fmt,note,E,key)
r+=1; r=section(ws,r,"RÉSULTATS")
ca=r; r=calc(ws,r,"Chiffre d'affaires mensuel",f"=B{E['installs']}*B{E['prix']}",MGA,True)
mat=r; r=calc(ws,r,"Coût du matériel",f"=B{ca}*B{E['mat']}",MGA)
mo=r; r=calc(ws,r,"Main-d'œuvre d'installation",f"=B{E['installs']}*B{E['mo']}",MGA)
mbr=r; r=calc(ws,r,"Marge brute",f"=B{ca}-B{mat}-B{mo}",MGA,True)
fix=r; r=calc(ws,r,"Charges fixes",f"=B{E['ntech']}*B{E['saltech']}*(1+B{E['cs']})+B{E['local']}+B{E['mkt']}+B{E['adm']}",MGA)
net=r; r=calc(ws,r,"RÉSULTAT NET MENSUEL",f"=B{mbr}-B{fix}",MGA,True,TEAL)
mrg=r; r=calc(ws,r,"Marge nette",f"=IF(B{ca}=0,0,B{net}/B{ca})",PCT,True)
cui=r; r=calc(ws,r,"Contribution par installation",f"=B{E['prix']}*(1-B{E['mat']})-B{E['mo']}",MGA,True)
r=calc(ws,r,"Seuil de rentabilité (installations / mois)",f"=IF(B{cui}=0,0,B{fix}/B{cui})",'0.0',True)
pb=r; r=calc(ws,r,"Retour sur investissement",f"=IF(B{net}>0,B{E['inv']}/B{net},\"non rentable\")",MOIS,True)
OUT["E"]=dict(inv=E['inv'],net=net,marge=mrg,pb=pb)
r+=1; r=section(ws,r,"SENSIBILITÉ — nombre d'installations par mois")
r=head_row(ws,r,["Installations","CA mensuel","Marge brute","Charges fixes","Résultat net"])
for n in [1,2,3,4,6]:
    ws.cell(row=r,column=1,value=n).border=box
    ws.cell(row=r,column=2,value=f"=A{r}*B{E['prix']}").number_format=MGA
    ws.cell(row=r,column=3,value=f"=B{r}*(1-B{E['mat']})-A{r}*B{E['mo']}").number_format=MGA
    ws.cell(row=r,column=4,value=f"=B{fix}").number_format=MGA
    ws.cell(row=r,column=5,value=f"=C{r}-D{r}").number_format=MGA
    for j in range(1,6): ws.cell(row=r,column=j).border=box
    r+=1

# ---------- COMPARAISON ----------
ws=wb.create_sheet("Comparaison")
title(ws,"COMPARAISON DES 5 MODÈLES","Synthèse automatique — les valeurs se mettent à jour avec chaque onglet")
widths(ws,(40,18,20,14,14,34)); r=4; r=section(ws,r,"TABLEAU DE BORD")
r=head_row(ws,r,["Modèle","Capital (Ar)","Résultat net / mois","Marge nette","Retour (mois)","Commentaire"])
for name,key,sh,comment in [
 ("A — Micro-agence numérique","A","A-Numerique","Le meilleur ratio rendement / capital"),
 ("B — Achats groupés","B","B-Achats","Faible marge, fort volume, zéro stock"),
 ("C — Logistique urbaine","C","C-Logistique","Rentable à partir de 2-3 motos"),
 ("D — Eau","D","D-Eau","Business de densité : 30 bonbonnes/jour minimum"),
 ("E — Froid & solaire","E","E-Solaire","Compétence technique = barrière à l'entrée")]:
    o=OUT[key]
    ws.cell(row=r,column=1,value=name).font=Font(bold=True,size=10)
    ws.cell(row=r,column=2,value=f"='{sh}'!B{o['inv']}").number_format=MGA
    ws.cell(row=r,column=3,value=f"='{sh}'!B{o['net']}").number_format=MGA
    ws.cell(row=r,column=4,value=f"='{sh}'!B{o['marge']}").number_format=PCT
    ws.cell(row=r,column=5,value=f"='{sh}'!B{o['pb']}").number_format=MOIS
    ws.cell(row=r,column=6,value=comment).font=Font(size=9,color="5C6B76")
    for j in range(1,7): ws.cell(row=r,column=j).border=box
    r+=1
r+=1; r=section(ws,r,"LECTURE")
for t in ["1. La micro-agence et le solaire offrent les meilleurs retours, mais exigent une compétence rare.",
          "2. L'eau et la logistique sont des business de volume : la rentabilité dépend du taux d'utilisation.",
          "3. Les achats groupés ont la marge la plus faible : ils ne fonctionnent que par le volume et la confiance.",
          "4. Aucun de ces modèles ne devient rentable sans un minimum de clients récurrents.",
          "5. Vérifiez chaque hypothèse sur le terrain avant d'engager du capital."]:
    ws.merge_cells(start_row=r,start_column=1,end_row=r,end_column=6)
    ws.cell(row=r,column=1,value=t).font=Font(size=10); r+=1

for s in wb.worksheets:
    s.sheet_view.showGridLines=False
    s.freeze_panes="A4"

wb.save("MODELE-FINANCIER.xlsx")
print("OK")
