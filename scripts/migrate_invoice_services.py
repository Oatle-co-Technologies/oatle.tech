"""Run the reviewed migration using the deployment environment; never print credentials or client rows."""
import json,pathlib,sys,hashlib,re,os,tempfile
import psycopg
from psycopg.rows import dict_row
root=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root))
from backend.database.pricing_catalogue import PRODUCTS,ADDONS,SERVICES
url=os.environ['DATABASE_URL']
url=re.sub(r'^postgres(?:ql)?\+\w+://','postgresql://',url)
try:c=psycopg.connect(url,connect_timeout=20,row_factory=dict_row)
except Exception as e: print('Connection failed:',type(e).__name__);sys.exit(1)
def rows(q):return c.execute(q).fetchall()
def fingerprint():
 result={}
 for table in ['invoices','invoice_payments','project_addons']:
  columns=[r['column_name'] for r in rows("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='"+table+"' ORDER BY ordinal_position") if r['column_name']!='service_id']
  data=rows('SELECT '+','.join('"'+x+'"' for x in columns)+' FROM public.'+table+' ORDER BY id')
  result[table]={'count':len(data),'sha256':hashlib.sha256(json.dumps(data,default=str,sort_keys=True).encode()).hexdigest()}
 return result
before=fingerprint()
backup={t:rows('SELECT * FROM public.'+t+' ORDER BY id') for t in ['products','addons','services']}
f=pathlib.Path(tempfile.gettempdir())/'oatle-invoice-catalogue-backup.json';f.write_text(json.dumps(backup,default=str));f.chmod(0o600)
print('Existing financial records:',{t:v['count'] for t,v in before.items()},flush=True)
print('Catalogue rows:',{t:len(v) for t,v in backup.items()},flush=True)
print('Schema:',rows("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('services','products','addons','invoices') ORDER BY table_name,ordinal_position"),flush=True)
if '--apply' not in sys.argv:c.rollback();c.close();sys.exit()
sql=(root/'sql/004_standalone_service_invoices.sql').read_text();sql=sql.replace('BEGIN;','',1);sql=sql.rsplit('COMMIT;',1)[0]
try:
 c.execute("SET LOCAL lock_timeout='15s'");c.execute(sql)
 for table,expected in [('products',PRODUCTS),('addons',ADDONS),('services',SERVICES)]:
  actual={r['name']:r for r in rows('SELECT * FROM public.'+table)}
  for item in expected:
   assert item['name'] in actual
   for k,v in item.items():assert actual[item['name']][k]==v,(table,item['name'],k)
  for old in backup[table]:
   name='SEO Optimisation' if old['name']=='SEO Optimization' and not any(x['name']=='SEO Optimisation' for x in backup[table]) else old['name']
   assert actual[name]['id']==old['id'] and actual[name]['active']==old['active']
 assert fingerprint()==before,'Existing financial records changed'
 c.commit()
 print('COMMITTED: 25 PDF services, 5 products, 9 add-ons verified; existing IDs, active flags, invoices, payments and agreed add-on prices unchanged.',flush=True)
 f=pathlib.Path(tempfile.gettempdir())/'oatle-invoice-migration-result.json';f.write_text(json.dumps({'verified':True,'financial_before_after':before,'services':25,'products':5,'addons':9}));f.chmod(0o600)
except Exception as e:
 c.rollback();print('ROLLED BACK:',type(e).__name__, str(e) if isinstance(e,AssertionError) else 'Database operation failed; credentials suppressed');sys.exit(1)
finally:c.close()
