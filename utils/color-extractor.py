import re
import json

def process(name, f_name, named_colors):
    r_color = re.compile('\s*(?:hi|highlight)\s+(?P<name>\w+)\s+(?:(?:(?:(?!guifg|guibg)\w+=\w+)|(?P<guifg>guifg=#{0,1}\w+)|(?P<guibg>guibg=#{0,1}\w+))\s+)+')
    r_color_link = re.compile('hi!\s+link\s+(?P<new>\w+)\s+(?P<existing>\w+)') 
    color_def = {}
    f_name = 'ColorSamplerPack/colors/' + f_name + '.vim'
    with open(f_name) as f:
        for line in f:
            m = r_color.match(line)
            if m:
                d = {}
                if m.group('guifg'):
                    c = m.group('guifg')[6:].lower()
                    if named_colors.has_key(c):
                        c = named_colors[c]
                    d['fg'] = c
                if m.group('guibg'):
                    c = m.group('guibg')[6:].lower()
                    if named_colors.has_key(c):
                        c = named_colors[c]
                    d['bg'] = c
                if not color_def.has_key(m.group('name')) and len(d.keys()) != 0:
                    color_def[m.group('name').lower()] = d
            else:
                m = r_color_link.match(line)
                if m and color_def.has_key(m.group('existing').lower()):
                    color_def[m.group('new').lower()] = color_def[m.group('existing').lower()]

    js_color_def = {
        'border': 'none',
        'background': 'none',
        'title': 'none',
        'link': 'none',
        'visited': 'none',
        'menuSel': 'none',
        'menuText': 'none',
        'menu': 'none',
        'misc': 'none'
    }

    for key in color_def.keys():
        if color_def[key].has_key('bg') and color_def[key]['bg'] == 'bg':
            color_def[key]['bg'] = color_def['normal']['bg']
        if color_def[key].has_key('fg') and color_def[key]['fg'] == 'fg':
            color_def[key]['fg'] = color_def['normal']['fg']

    if color_def.has_key('vertsplit'):
        js_color_def['border'] = color_def['vertsplit']['bg']
    
    if color_def.has_key('normal'):
        js_color_def['background'] = color_def['normal']['bg']
    
    if color_def.has_key('constant'):
        js_color_def['title'] = color_def['constant']['fg']

    if color_def.has_key('special'):
        js_color_def['link'] = color_def['special']['fg']
    elif color_def.has_key('statement'):
        js_color_def['link'] = color_def['statement']['fg']
    elif color_def.has_key('normal'):
        js_color_def['link'] = color_def['normal']['fg']

    if color_def.has_key('comment'):
        js_color_def['visited'] = color_def['comment']['fg']
    elif color_def.has_key('type'):
        js_color_def['visited'] = color_def['type']['fg']

    if color_def.has_key('pmenusel'):
        js_color_def['menuSel'] = color_def['pmenusel']['bg']
    elif color_def.has_key('statusline'):
        js_color_def['menuSel'] = color_def['statusline']['bg']

    if color_def.has_key('pmenu'):
        js_color_def['menu'] = color_def['pmenu']['bg']
    elif color_def.has_key('modemsg'):
        js_color_def['menu'] = color_def['modemsg']['bg']
    elif color_def.has_key('visual'):
        js_color_def['menu'] = color_def['visual']['bg']

    if color_def.has_key('pmenu'):
        js_color_def['menuText'] = color_def['pmenu']['fg']
    elif color_def.has_key('modemsg'):
        js_color_def['menuText'] = color_def['modemsg']['fg']
    elif color_def.has_key('visual'):
        js_color_def['menuText'] = color_def['visual']['fg']

    if color_def.has_key('string'):
        js_color_def['misc'] = color_def['string']['fg']
    elif color_def.has_key('preproc'):
        js_color_def['menuText'] = color_def['preproc']['fg']

    if js_color_def['menu'] == js_color_def['background']:
        js_color_def['menu'] = "none"

    for key in js_color_def.keys():
        if js_color_def[key] == 'none':
            del js_color_def[key]

    return js_color_def

def get_colors():
    colors = {}

    rx = re.compile('^\s*(?P<r>\d+)\s+(?P<g>\d+)\s+(?P<b>\d+)\s+(?P<name>\w+)$')
    f = open('rgb.txt')
    for line in f:
        m = rx.match(line)
        if m:
            r = hex(int(m.group('r')))[2:]
            g = hex(int(m.group('g')))[2:]
            b = hex(int(m.group('b')))[2:]
            if len(r) == 1:
                r = '0' + r
            if len(g) == 1:
                g = '0' + g
            if len(b) == 1:
                b = '0' + b
            name = m.group('name').lower()
            colors[name] = '#' + r + g + b
    f.close()
    print colors['black']
    return colors

named_colors = get_colors()

r_dark = re.compile('amenu .+Dark\.(?P<name>.+) :colo (?P<file>.+)<CR>')
r_light = re.compile('amenu .+Light\.(?P<name>.+) :colo (?P<file>.+)<CR>')
schemes = {'dark': {}, 'light': {}}
with open("ColorSamplerPack/plugin/color_sample_pack.vim") as f:
    for line in f:
        m = r_dark.match(line)
        if m:
            schemes['dark'][m.group('name')] = m.group('file')
        else:
            m = r_light.match(line)
            if m:
                schemes['light'][m.group('name')] = m.group('file')

result = {'dark': {}, 'light': {}}
for t in ['dark', 'light']:
    for k, v in schemes[t].iteritems():
        print k
        try:
            d = process(k, v, named_colors)
            if (len(d.keys()) > 3):
                result[t][k] = d
            print result[t][k]
        except Exception, e:
            print 'Error in ' + k + ' ' 
            print e

f = open('colors.js', 'w')
f.write("""// Author: Matija Podravec, 2012.

if (!mpagespace.model.colors) mpagespace.model.colors = {};
else if (typeof mpagespace.model.colors != 'object')
  throw new Error('mpagespace.model.colors already exists and is not an object'); 

mpagespace.model.colors = function(config, model) {
  this.model = model;
  this.config = mpagespace.extend({dark: {}, light: {}}, config);
  this.dirty = false;
}

mpagespace.model.colors.prototype = {
  getConfig: function() {
    return mpagespace.extend({}, this.config);  
  },

  getSchemeNames: function(type) {
    var result = [];
    var name, f = true;

    for (name in this.schemes[type]) {
      result.push(name);
    }
    result.sort();
      
    for (name in this.config[type]) {
      if (f) {
        result.unshift('-');
        f = false;
      }
      result.unshift(name);
    }
    result.unshift('-');
    result.unshift('custom');
    result.unshift('default');

    return result;
  },

  getShuffledScheme: function(type) {
    var h, H, backS, darkL, backL, i, minS, maxS, minL, maxL, s, l;
    var colors = [];

    var random = function(start, end) {
      return Math.floor(Math.random() * (end + 1 - start)) + start;
    }

    h = random(0, 360);
    H = [];
    for (i=0; i<6; i++) {
      H.push((h + i * 60) % 360);
    }

    if (type == 'light') {
      backS = random(40, 70);
      backL = random(95, 100);
      rangeL = -random(70, 80);
    } else {
      backS = random(5, 40);
      backL = random(0, 10);
      rangeL = 90 - backL;
    }
    for (i=0; i<8; i++) {
      colors.push(mpagespace.husl.toHex(H[0], backS, backL + rangeL * Math.pow(i/7, 1.5)));
    }

    if (type == 'light') {
      minS = 80;
      maxS = 100;
      minL = 35;
      maxL = 55;
    } else {
      minS = random(30, 70);
      maxS = minS + 30;
      minL = random(50, 70);
      maxL = minL + 20;
    }

    for (i=0; i<8; i++) {
      h = H[random(0, 5)];
      s = random(minS, maxS);
      l = random(minL, maxL);
      colors.push(mpagespace.husl.toHex(h, s, l));
    }
    
    if (type == 'light') {
      return {
        background: colors[0],
        border: colors[3],
        link: colors[8],
        visited: colors[11],
        title: colors[9],
        menu: colors[3],
        menuText: colors[7],
        menuSel: colors[5],
        misc: colors[12]
      }
    } else {
      return {
        background: colors[1],
        border: colors[4],
        link: colors[8],
        visited: colors[11],
        title: colors[9],
        menu: colors[7],
        menuText: colors[1],
        menuSel: colors[6],
        misc: colors[12]
      }
    }
  },

  getScheme: function(type, name) {
    if (name in this.schemes[type])
      return this.schemes[type][name];

    if (name in this.config[type])
      return this.config[type][name];

    if (name == 'default')
      return {}
  },

  addScheme: function(type, name, scheme) {
    this.config[type][name] = scheme;
    this.dirty = true;
    this.model.setDirty();
  },

  removeSchemes: function() {
    this.config = {dark: {}, light: {}};
    this.dirty = true;
    this.model.setDirty();
  },

  schemes: """);
f.write(json.dumps(result, indent=2))
f.write("""
}""")
f.close()


