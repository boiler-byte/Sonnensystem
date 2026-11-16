#!/usr/bin/env node
/** Offline schema, references, hierarchy, and editorial integrity validation. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/data/catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const readJSON=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
try{
  const {bodies,articles,version}=await loadCatalog(readJSON);
  const counts=new Map();
  for(const body of bodies)counts.set(body.type,(counts.get(body.type)||0)+1);
  console.log(`OK — Katalog ${version}: ${bodies.length} Himmelskörper, ${articles.size} redaktionelle Einträge`);
  console.log([...counts].map(([type,count])=>`${type}: ${count}`).join(' | '));
}catch(error){console.error(error.message);process.exitCode=1;}
