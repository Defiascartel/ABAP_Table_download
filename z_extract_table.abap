*&---------------------------------------------------------------------*
*& Report Z_EXTRACT_TABLE_META
*&---------------------------------------------------------------------*
*& Estrae metadati delle tabelle SAP in formato JSON strutturato
*& per l'utilizzo con Claude Code e altri strumenti AI/LLM.
*&
*& Compatibile con SAP_BASIS >= 702
*&---------------------------------------------------------------------*
REPORT z_extract_table_meta.

*----------------------------------------------------------------------*
* Tipi locali
*----------------------------------------------------------------------*
TYPES:
  BEGIN OF ty_domain_value,
    low        TYPE char40,
    high       TYPE char40,
    description TYPE char60,
  END OF ty_domain_value,
  ty_domain_value_tab TYPE STANDARD TABLE OF ty_domain_value WITH EMPTY KEY,

  BEGIN OF ty_field_meta,
    position      TYPE i,
    fieldname     TYPE fieldname,
    is_key        TYPE abap_bool,
    rollname      TYPE rollname,
    domname       TYPE domname,
    datatype      TYPE datatype_d,
    leng          TYPE ddleng,
    decimals      TYPE decimals,
    inttype       TYPE inttype,
    notnull       TYPE abap_bool,
    field_text    TYPE as4text,
    rollname_text TYPE as4text,
    domname_text  TYPE as4text,
    checktable    TYPE tabname,
    convexit      TYPE convexit,
    dom_values    TYPE ty_domain_value_tab,
  END OF ty_field_meta,
  ty_field_meta_tab TYPE STANDARD TABLE OF ty_field_meta WITH EMPTY KEY,

  BEGIN OF ty_table_meta,
    tabname       TYPE tabname,
    tabclass      TYPE tabclass,
    tabclass_text TYPE char30,
    description   TYPE as4text,
    contflag      TYPE contflag,
    sqltab        TYPE sqltab,
    as4user       TYPE as4user,
    as4date       TYPE as4date,
    fields        TYPE ty_field_meta_tab,
    total_fields  TYPE i,
    total_keys    TYPE i,
  END OF ty_table_meta,

  ty_table_meta_tab TYPE STANDARD TABLE OF ty_table_meta WITH EMPTY KEY.

*----------------------------------------------------------------------*
* Classe helper
*----------------------------------------------------------------------*
CLASS lcl_helper DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS:
      escape_json IMPORTING iv_text        TYPE clike
                  RETURNING VALUE(rv_text) TYPE string,
      escape_csv  IMPORTING iv_text        TYPE clike
                  RETURNING VALUE(rv_text) TYPE string,
      int_to_str  IMPORTING iv_int         TYPE i
                  RETURNING VALUE(rv_str)  TYPE string.
ENDCLASS.

CLASS lcl_helper IMPLEMENTATION.
  METHOD escape_json.
    rv_text = iv_text.
    REPLACE ALL OCCURRENCES OF '\' IN rv_text WITH '\\'.
    REPLACE ALL OCCURRENCES OF '"' IN rv_text WITH '\"'.
    REPLACE ALL OCCURRENCES OF cl_abap_char_utilities=>cr_lf IN rv_text WITH '\n'.
    REPLACE ALL OCCURRENCES OF cl_abap_char_utilities=>newline IN rv_text WITH '\n'.
    CONDENSE rv_text.
  ENDMETHOD.

  METHOD escape_csv.
    rv_text = iv_text.
    REPLACE ALL OCCURRENCES OF '"' IN rv_text WITH '""'.
    CONDENSE rv_text.
  ENDMETHOD.

  METHOD int_to_str.
    rv_str = iv_int.
    CONDENSE rv_str.
  ENDMETHOD.
ENDCLASS.

*----------------------------------------------------------------------*
* Selection Screen
*----------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b01 WITH FRAME TITLE TEXT-b01.
  SELECT-OPTIONS: s_tabnm FOR ('DD02L-TABNAME').
  PARAMETERS:
    p_maxfld TYPE i DEFAULT 0,
    p_domval AS CHECKBOX DEFAULT 'X',
    p_chktab AS CHECKBOX DEFAULT 'X',
    p_desc   AS CHECKBOX DEFAULT 'X'.
SELECTION-SCREEN END OF BLOCK b01.

SELECTION-SCREEN BEGIN OF BLOCK b02 WITH FRAME TITLE TEXT-b02.
  PARAMETERS:
    p_json   RADIOBUTTON GROUP fmt DEFAULT 'X',
    p_csv    RADIOBUTTON GROUP fmt,
    p_md     RADIOBUTTON GROUP fmt.
SELECTION-SCREEN END OF BLOCK b02.

SELECTION-SCREEN BEGIN OF BLOCK b03 WITH FRAME TITLE TEXT-b03.
  PARAMETERS:
    p_gui    RADIOBUTTON GROUP out DEFAULT 'X',
    p_down   RADIOBUTTON GROUP out,
    p_clip   RADIOBUTTON GROUP out,
    p_srvr   RADIOBUTTON GROUP out.
  PARAMETERS:
    p_fpath  TYPE string LOWER CASE DEFAULT '/tmp/sap_table_meta.json'.
SELECTION-SCREEN END OF BLOCK b03.

*----------------------------------------------------------------------*
* Variabili globali
*----------------------------------------------------------------------*
DATA: gt_result TYPE ty_table_meta_tab,
      gv_output TYPE string,
      gv_nl     TYPE string.

*----------------------------------------------------------------------*
* INITIALIZATION
*----------------------------------------------------------------------*
INITIALIZATION.
  gv_nl = cl_abap_char_utilities=>newline.

*----------------------------------------------------------------------*
* START-OF-SELECTION
*----------------------------------------------------------------------*
START-OF-SELECTION.

  PERFORM extract_metadata.
  PERFORM format_output.
  PERFORM deliver_output.

*&---------------------------------------------------------------------*
*& Form EXTRACT_METADATA
*&---------------------------------------------------------------------*
FORM extract_metadata.

  DATA: lt_dd02l    TYPE STANDARD TABLE OF dd02l,
        ls_dd02l    TYPE dd02l,
        lt_dd03l    TYPE STANDARD TABLE OF dd03l,
        ls_dd03l    TYPE dd03l,
        lt_dd04t    TYPE STANDARD TABLE OF dd04t,
        ls_dd04t    TYPE dd04t,
        lt_dd01t    TYPE STANDARD TABLE OF dd01t,
        ls_dd01t    TYPE dd01t,
        ls_dd02v    TYPE dd02v,
        ls_meta     TYPE ty_table_meta,
        ls_field    TYPE ty_field_meta,
        lt_dd07v    TYPE STANDARD TABLE OF dd07v,
        ls_dd07v    TYPE dd07v,
        ls_domval   TYPE ty_domain_value,
        lv_count    TYPE i,
        lv_keycnt   TYPE i,
        lv_langu    TYPE sy-langu,
        lv_convexit TYPE convexit,
        lv_msg      TYPE char80,
        lv_lines    TYPE i,
        lv_lines_c  TYPE char10.

  lv_langu = sy-langu.
  IF lv_langu IS INITIAL.
    lv_langu = 'E'.
  ENDIF.

  SELECT * FROM dd02l INTO TABLE lt_dd02l
    WHERE tabname IN s_tabnm
      AND as4local = 'A'
      AND as4vers  = '0000'.

  IF lt_dd02l IS INITIAL.
    MESSAGE 'Nessuna tabella trovata per la selezione indicata.' TYPE 'S' DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  SELECT * FROM dd03l INTO TABLE lt_dd03l
    WHERE tabname IN s_tabnm
      AND as4local = 'A'
      AND as4vers  = '0000'
    ORDER BY tabname position.

  IF p_desc = abap_true.
    SELECT * FROM dd04t INTO TABLE lt_dd04t
      WHERE ddlanguage = lv_langu
        AND as4local = 'A'
        AND as4vers  = '0000'.
    SORT lt_dd04t BY rollname.

    SELECT * FROM dd01t INTO TABLE lt_dd01t
      WHERE ddlanguage = lv_langu
        AND as4local = 'A'
        AND as4vers  = '0000'.
    SORT lt_dd01t BY domname.
  ENDIF.

  LOOP AT lt_dd02l INTO ls_dd02l.
    CLEAR ls_meta.
    ls_meta-tabname   = ls_dd02l-tabname.
    ls_meta-tabclass  = ls_dd02l-tabclass.
    ls_meta-contflag  = ls_dd02l-contflag.
    ls_meta-sqltab    = ls_dd02l-sqltab.
    ls_meta-as4user   = ls_dd02l-as4user.
    ls_meta-as4date   = ls_dd02l-as4date.

    CASE ls_dd02l-tabclass.
      WHEN 'TRANSP'. ls_meta-tabclass_text = 'Transparent Table'.
      WHEN 'CLUSTER'. ls_meta-tabclass_text = 'Cluster Table'.
      WHEN 'POOL'.   ls_meta-tabclass_text = 'Pool Table'.
      WHEN 'INTTAB'. ls_meta-tabclass_text = 'Structure'.
      WHEN 'VIEW'.   ls_meta-tabclass_text = 'View'.
      WHEN 'APPEND'. ls_meta-tabclass_text = 'Append Structure'.
      WHEN OTHERS.   ls_meta-tabclass_text = ls_dd02l-tabclass.
    ENDCASE.

    IF p_desc = abap_true.
      CALL FUNCTION 'DDIF_TABL_GET'
        EXPORTING
          name          = ls_dd02l-tabname
          langu         = lv_langu
        IMPORTING
          dd02v_wa      = ls_dd02v
        EXCEPTIONS
          illegal_input = 1
          OTHERS        = 2.
      IF sy-subrc = 0.
        ls_meta-description = ls_dd02v-ddtext.
      ENDIF.
    ENDIF.

    lv_count = 0.
    lv_keycnt = 0.
    LOOP AT lt_dd03l INTO ls_dd03l WHERE tabname = ls_dd02l-tabname.
      IF ls_dd03l-fieldname(1) = '.'.
        CONTINUE.
      ENDIF.

      lv_count = lv_count + 1.
      IF p_maxfld > 0 AND lv_count > p_maxfld.
        EXIT.
      ENDIF.

      CLEAR ls_field.
      ls_field-position   = ls_dd03l-position.
      ls_field-fieldname  = ls_dd03l-fieldname.
      ls_field-rollname   = ls_dd03l-rollname.
      ls_field-domname    = ls_dd03l-domname.
      ls_field-datatype   = ls_dd03l-datatype.
      ls_field-leng       = ls_dd03l-leng.
      ls_field-decimals   = ls_dd03l-decimals.
      ls_field-inttype    = ls_dd03l-inttype.
      ls_field-checktable = ls_dd03l-checktable.

      IF ls_dd03l-keyflag = 'X'.
        ls_field-is_key = abap_true.
        lv_keycnt = lv_keycnt + 1.
      ELSE.
        ls_field-is_key = abap_false.
      ENDIF.

      IF ls_dd03l-notnull = 'X'.
        ls_field-notnull = abap_true.
      ELSE.
        ls_field-notnull = abap_false.
      ENDIF.

      IF ls_dd03l-domname IS NOT INITIAL.
        SELECT SINGLE convexit FROM dd01l
          INTO lv_convexit
          WHERE domname  = ls_dd03l-domname
            AND as4local = 'A'
            AND as4vers  = '0000'.
        IF sy-subrc = 0.
          ls_field-convexit = lv_convexit.
        ENDIF.
      ENDIF.

      IF p_desc = abap_true.
        IF ls_dd03l-rollname IS NOT INITIAL.
          READ TABLE lt_dd04t INTO ls_dd04t
            WITH KEY rollname = ls_dd03l-rollname BINARY SEARCH.
          IF sy-subrc = 0.
            ls_field-field_text    = ls_dd04t-ddtext.
            ls_field-rollname_text = ls_dd04t-ddtext.
          ENDIF.
        ENDIF.

        IF ls_dd03l-domname IS NOT INITIAL.
          READ TABLE lt_dd01t INTO ls_dd01t
            WITH KEY domname = ls_dd03l-domname BINARY SEARCH.
          IF sy-subrc = 0.
            ls_field-domname_text = ls_dd01t-ddtext.
          ENDIF.
        ENDIF.
      ENDIF.

      IF p_domval = abap_true AND ls_dd03l-domname IS NOT INITIAL.
        CLEAR lt_dd07v.
        CALL FUNCTION 'DD_DOMVALUES_GET'
          EXPORTING
            domname        = ls_dd03l-domname
            text           = abap_true
            langu          = lv_langu
          TABLES
            dd07v_tab      = lt_dd07v
          EXCEPTIONS
            wrong_textflag = 1
            OTHERS         = 2.

        IF sy-subrc = 0 AND lt_dd07v IS NOT INITIAL.
          LOOP AT lt_dd07v INTO ls_dd07v.
            CLEAR ls_domval.
            ls_domval-low         = ls_dd07v-domvalue_l.
            ls_domval-high        = ls_dd07v-domvalue_h.
            ls_domval-description = ls_dd07v-ddtext.
            APPEND ls_domval TO ls_field-dom_values.
          ENDLOOP.
        ENDIF.
      ENDIF.

      APPEND ls_field TO ls_meta-fields.
    ENDLOOP.

    ls_meta-total_fields = lv_count.
    ls_meta-total_keys   = lv_keycnt.

    APPEND ls_meta TO gt_result.
  ENDLOOP.

  lv_lines = lines( gt_result ).
  lv_lines_c = lv_lines.
  CONDENSE lv_lines_c.
  CONCATENATE 'Estratte' lv_lines_c 'tabelle.' INTO lv_msg SEPARATED BY space.
  MESSAGE lv_msg TYPE 'S'.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form FORMAT_OUTPUT
*&---------------------------------------------------------------------*
FORM format_output.
  CASE abap_true.
    WHEN p_json. PERFORM format_json.
    WHEN p_csv.  PERFORM format_csv.
    WHEN p_md.   PERFORM format_markdown.
  ENDCASE.
ENDFORM.

*&---------------------------------------------------------------------*
*& Form FORMAT_JSON
*&---------------------------------------------------------------------*
FORM format_json.

  DATA: lv_json    TYPE string,
        ls_meta    TYPE ty_table_meta,
        ls_field   TYPE ty_field_meta,
        ls_domval  TYPE ty_domain_value,
        lv_tab_idx TYPE i,
        lv_tab_cnt TYPE i,
        lv_fld_idx TYPE i,
        lv_fld_cnt TYPE i,
        lv_val_idx TYPE i,
        lv_val_cnt TYPE i,
        lv_esc     TYPE string,
        lv_esc_ft  TYPE string,
        lv_esc_rt  TYPE string,
        lv_esc_dt  TYPE string,
        lv_esc_low TYPE string,
        lv_esc_hi  TYPE string,
        lv_esc_dsc TYPE string,
        lv_key_str TYPE string,
        lv_nn_str  TYPE string,
        lv_cnt_str TYPE string,
        lv_tf_str  TYPE string,
        lv_tk_str  TYPE string,
        lv_pos_str TYPE string,
        lv_len_str TYPE string,
        lv_dec_str TYPE string.

  lv_tab_cnt = lines( gt_result ).
  lv_cnt_str = lcl_helper=>int_to_str( lv_tab_cnt ).

  CONCATENATE
    '{' gv_nl
    '  "_metadata": {' gv_nl
    '    "generated_at": "' sy-datum '-' sy-uzeit '",' gv_nl
    '    "sap_system": "' sy-sysid '",' gv_nl
    '    "client": "' sy-mandt '",' gv_nl
    '    "language": "' sy-langu '",' gv_nl
    '    "total_tables": ' lv_cnt_str gv_nl
    '  },' gv_nl
    '  "tables": [' gv_nl
    INTO lv_json.

  lv_tab_idx = 0.
  LOOP AT gt_result INTO ls_meta.
    lv_tab_idx = lv_tab_idx + 1.

    lv_esc    = lcl_helper=>escape_json( ls_meta-description ).
    lv_tf_str = lcl_helper=>int_to_str( ls_meta-total_fields ).
    lv_tk_str = lcl_helper=>int_to_str( ls_meta-total_keys ).

    CONCATENATE lv_json
      '    {' gv_nl
      '      "table_name": "' ls_meta-tabname '",' gv_nl
      '      "description": "' lv_esc '",' gv_nl
      '      "table_class": "' ls_meta-tabclass '",' gv_nl
      '      "table_class_text": "' ls_meta-tabclass_text '",' gv_nl
      '      "delivery_class": "' ls_meta-contflag '",' gv_nl
      '      "db_table": "' ls_meta-sqltab '",' gv_nl
      '      "last_changed_by": "' ls_meta-as4user '",' gv_nl
      '      "last_changed_date": "' ls_meta-as4date '",' gv_nl
      '      "total_fields": ' lv_tf_str ',' gv_nl
      '      "total_keys": ' lv_tk_str ',' gv_nl
      '      "fields": [' gv_nl
      INTO lv_json.

    lv_fld_idx = 0.
    lv_fld_cnt = lines( ls_meta-fields ).

    LOOP AT ls_meta-fields INTO ls_field.
      lv_fld_idx = lv_fld_idx + 1.

      lv_pos_str = lcl_helper=>int_to_str( ls_field-position ).
      lv_len_str = ls_field-leng.     CONDENSE lv_len_str.
      lv_dec_str = ls_field-decimals.  CONDENSE lv_dec_str.

      IF ls_field-is_key = abap_true.
        lv_key_str = 'true'.
      ELSE.
        lv_key_str = 'false'.
      ENDIF.

      IF ls_field-notnull = abap_true.
        lv_nn_str = 'true'.
      ELSE.
        lv_nn_str = 'false'.
      ENDIF.

      CONCATENATE lv_json
        '        {' gv_nl
        '          "position": ' lv_pos_str ',' gv_nl
        '          "field_name": "' ls_field-fieldname '",' gv_nl
        '          "is_key": ' lv_key_str ',' gv_nl
        '          "data_element": "' ls_field-rollname '",' gv_nl
        '          "domain": "' ls_field-domname '",' gv_nl
        '          "abap_type": "' ls_field-datatype '",' gv_nl
        '          "length": ' lv_len_str ',' gv_nl
        '          "decimals": ' lv_dec_str ',' gv_nl
        '          "internal_type": "' ls_field-inttype '",' gv_nl
        '          "not_null": ' lv_nn_str ',' gv_nl
        INTO lv_json.

      IF p_desc = abap_true.
        lv_esc_ft = lcl_helper=>escape_json( ls_field-field_text ).
        lv_esc_rt = lcl_helper=>escape_json( ls_field-rollname_text ).
        lv_esc_dt = lcl_helper=>escape_json( ls_field-domname_text ).
        CONCATENATE lv_json
          '          "field_description": "' lv_esc_ft '",' gv_nl
          '          "data_element_description": "' lv_esc_rt '",' gv_nl
          '          "domain_description": "' lv_esc_dt '",' gv_nl
          INTO lv_json.
      ENDIF.

      IF p_chktab = abap_true AND ls_field-checktable IS NOT INITIAL.
        CONCATENATE lv_json
          '          "check_table": "' ls_field-checktable '",' gv_nl
          INTO lv_json.
      ENDIF.

      IF ls_field-convexit IS NOT INITIAL.
        CONCATENATE lv_json
          '          "conversion_exit": "' ls_field-convexit '",' gv_nl
          INTO lv_json.
      ENDIF.

      lv_val_cnt = lines( ls_field-dom_values ).
      IF lv_val_cnt > 0.
        CONCATENATE lv_json
          '          "domain_fixed_values": [' gv_nl
          INTO lv_json.

        lv_val_idx = 0.
        LOOP AT ls_field-dom_values INTO ls_domval.
          lv_val_idx = lv_val_idx + 1.

          lv_esc_low = lcl_helper=>escape_json( ls_domval-low ).
          lv_esc_dsc = lcl_helper=>escape_json( ls_domval-description ).

          CONCATENATE lv_json
            '            { "value": "' lv_esc_low '"'
            INTO lv_json.

          IF ls_domval-high IS NOT INITIAL.
            lv_esc_hi = lcl_helper=>escape_json( ls_domval-high ).
            CONCATENATE lv_json
              ', "high": "' lv_esc_hi '"'
              INTO lv_json.
          ENDIF.

          CONCATENATE lv_json
            ', "description": "' lv_esc_dsc '" }'
            INTO lv_json.

          IF lv_val_idx < lv_val_cnt.
            CONCATENATE lv_json ',' INTO lv_json.
          ENDIF.
          CONCATENATE lv_json gv_nl INTO lv_json.
        ENDLOOP.

        CONCATENATE lv_json
          '          ],' gv_nl
          INTO lv_json.
      ENDIF.

      CONCATENATE lv_json
        '          "_end": true' gv_nl
        '        }'
        INTO lv_json.

      IF lv_fld_idx < lv_fld_cnt.
        CONCATENATE lv_json ',' INTO lv_json.
      ENDIF.
      CONCATENATE lv_json gv_nl INTO lv_json.
    ENDLOOP.

    CONCATENATE lv_json
      '      ]' gv_nl
      '    }'
      INTO lv_json.

    IF lv_tab_idx < lv_tab_cnt.
      CONCATENATE lv_json ',' INTO lv_json.
    ENDIF.
    CONCATENATE lv_json gv_nl INTO lv_json.
  ENDLOOP.

  CONCATENATE lv_json
    '  ]' gv_nl
    '}' gv_nl
    INTO lv_json.

  gv_output = lv_json.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form FORMAT_CSV
*&---------------------------------------------------------------------*
FORM format_csv.

  DATA: lv_csv     TYPE string,
        ls_meta    TYPE ty_table_meta,
        ls_field   TYPE ty_field_meta,
        ls_dv      TYPE ty_domain_value,
        lv_domvals TYPE string,
        lv_key_str TYPE string,
        lv_nn_str  TYPE string,
        lv_esc_d   TYPE string,
        lv_esc_f   TYPE string,
        lv_esc_r   TYPE string,
        lv_esc_dm  TYPE string,
        lv_esc_dv  TYPE string,
        lv_pos_str TYPE string,
        lv_len_str TYPE string,
        lv_dec_str TYPE string.

  CONCATENATE
    'TABLE_NAME;TABLE_CLASS;TABLE_DESC;FIELD_POS;FIELD_NAME;IS_KEY;'
    'DATA_ELEMENT;DOMAIN;ABAP_TYPE;LENGTH;DECIMALS;INT_TYPE;NOT_NULL;'
    'FIELD_DESC;DE_DESC;DOM_DESC;CHECK_TABLE;CONV_EXIT;DOM_VALUES'
    gv_nl
    INTO lv_csv.

  LOOP AT gt_result INTO ls_meta.
    LOOP AT ls_meta-fields INTO ls_field.

      CLEAR lv_domvals.
      LOOP AT ls_field-dom_values INTO ls_dv.
        IF lv_domvals IS NOT INITIAL.
          CONCATENATE lv_domvals ',' INTO lv_domvals.
        ENDIF.
        CONCATENATE lv_domvals ls_dv-low '=' ls_dv-description INTO lv_domvals.
      ENDLOOP.

      IF ls_field-is_key = abap_true.
        lv_key_str = 'X'.
      ELSE.
        CLEAR lv_key_str.
      ENDIF.

      IF ls_field-notnull = abap_true.
        lv_nn_str = 'X'.
      ELSE.
        CLEAR lv_nn_str.
      ENDIF.

      lv_esc_d  = lcl_helper=>escape_csv( ls_meta-description ).
      lv_esc_f  = lcl_helper=>escape_csv( ls_field-field_text ).
      lv_esc_r  = lcl_helper=>escape_csv( ls_field-rollname_text ).
      lv_esc_dm = lcl_helper=>escape_csv( ls_field-domname_text ).
      lv_esc_dv = lcl_helper=>escape_csv( lv_domvals ).
      lv_pos_str = lcl_helper=>int_to_str( ls_field-position ).
      lv_len_str = ls_field-leng.     CONDENSE lv_len_str.
      lv_dec_str = ls_field-decimals.  CONDENSE lv_dec_str.

      CONCATENATE lv_csv
        ls_meta-tabname ';'
        ls_meta-tabclass ';'
        '"' lv_esc_d '";'
        lv_pos_str ';'
        ls_field-fieldname ';'
        lv_key_str ';'
        ls_field-rollname ';'
        ls_field-domname ';'
        ls_field-datatype ';'
        lv_len_str ';'
        lv_dec_str ';'
        ls_field-inttype ';'
        lv_nn_str ';'
        '"' lv_esc_f '";'
        '"' lv_esc_r '";'
        '"' lv_esc_dm '";'
        ls_field-checktable ';'
        ls_field-convexit ';'
        '"' lv_esc_dv '"'
        gv_nl
        INTO lv_csv.
    ENDLOOP.
  ENDLOOP.

  gv_output = lv_csv.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form FORMAT_MARKDOWN
*&---------------------------------------------------------------------*
FORM format_markdown.

  DATA: lv_md      TYPE string,
        ls_meta    TYPE ty_table_meta,
        ls_field   TYPE ty_field_meta,
        ls_dv      TYPE ty_domain_value,
        lv_key_mk  TYPE string,
        lv_vals    TYPE string,
        lv_cnt_str TYPE string,
        lv_tf_str  TYPE string,
        lv_tk_str  TYPE string,
        lv_pos_str TYPE string,
        lv_len_str TYPE string,
        lv_dec_str TYPE string.

  lv_cnt_str = lcl_helper=>int_to_str( lines( gt_result ) ).

  CONCATENATE
    '# SAP Table Metadata Extract' gv_nl
    '**System:** ' sy-sysid ' / Client ' sy-mandt
    ' | **Date:** ' sy-datum
    ' | **Tables:** ' lv_cnt_str gv_nl gv_nl
    '---' gv_nl gv_nl
    INTO lv_md.

  LOOP AT gt_result INTO ls_meta.

    lv_tf_str = lcl_helper=>int_to_str( ls_meta-total_fields ).
    lv_tk_str = lcl_helper=>int_to_str( ls_meta-total_keys ).

    CONCATENATE lv_md
      '## ' ls_meta-tabname ' - ' ls_meta-description gv_nl gv_nl
      'Class: `' ls_meta-tabclass '` (' ls_meta-tabclass_text ')'
      ' | Delivery: `' ls_meta-contflag '`'
      ' | Fields: ' lv_tf_str
      ' | Keys: ' lv_tk_str gv_nl gv_nl
      '| Pos | Field | Key | Data Element | Domain | Type | Len | Dec | Description |' gv_nl
      '| ---:| ----- | :-: | ------------ | ------ | ---- | --: | --: | ----------- |' gv_nl
      INTO lv_md.

    LOOP AT ls_meta-fields INTO ls_field.
      IF ls_field-is_key = abap_true.
        lv_key_mk = 'PK'.
      ELSE.
        CLEAR lv_key_mk.
      ENDIF.

      lv_pos_str = lcl_helper=>int_to_str( ls_field-position ).
      lv_len_str = ls_field-leng.     CONDENSE lv_len_str.
      lv_dec_str = ls_field-decimals.  CONDENSE lv_dec_str.

      CONCATENATE lv_md
        '| ' lv_pos_str
        ' | ' ls_field-fieldname
        ' | ' lv_key_mk
        ' | ' ls_field-rollname
        ' | ' ls_field-domname
        ' | ' ls_field-datatype
        ' | ' lv_len_str
        ' | ' lv_dec_str
        ' | ' ls_field-field_text
        ' |' gv_nl
        INTO lv_md.

      IF ls_field-dom_values IS NOT INITIAL.
        CLEAR lv_vals.
        LOOP AT ls_field-dom_values INTO ls_dv.
          IF lv_vals IS NOT INITIAL.
            CONCATENATE lv_vals ', ' INTO lv_vals.
          ENDIF.
          CONCATENATE lv_vals '`' ls_dv-low '`=' ls_dv-description INTO lv_vals.
        ENDLOOP.

        CONCATENATE lv_md
          '| | Values: | | ' lv_vals ' | | | | | |' gv_nl
          INTO lv_md.
      ENDIF.
    ENDLOOP.

    CONCATENATE lv_md gv_nl '---' gv_nl gv_nl INTO lv_md.
  ENDLOOP.

  gv_output = lv_md.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form DELIVER_OUTPUT
*&---------------------------------------------------------------------*
FORM deliver_output.

  CHECK gv_output IS NOT INITIAL.

  CASE abap_true.
    WHEN p_gui.  PERFORM display_text_editor.
    WHEN p_down. PERFORM download_to_pc.
    WHEN p_clip. PERFORM copy_to_clipboard.
    WHEN p_srvr. PERFORM save_to_server.
  ENDCASE.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form DISPLAY_TEXT_EDITOR
*&---------------------------------------------------------------------*
FORM display_text_editor.

  DATA: lt_lines TYPE STANDARD TABLE OF char255.

  SPLIT gv_output AT gv_nl INTO TABLE lt_lines.

  CALL FUNCTION 'POPUP_WITH_TABLE_DISPLAY'
    EXPORTING
      endpos_col   = 200
      endpos_row   = 40
      startpos_col = 1
      startpos_row = 1
      titletext    = 'Table Metadata Output'
    TABLES
      valuetab     = lt_lines
    EXCEPTIONS
      break_off    = 1
      OTHERS       = 2.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form DOWNLOAD_TO_PC
*&---------------------------------------------------------------------*
FORM download_to_pc.

  DATA: lv_filename TYPE string,
        lv_ext      TYPE string,
        lv_msg      TYPE char80,
        lt_data     TYPE STANDARD TABLE OF string.

  CASE abap_true.
    WHEN p_json. lv_ext = 'json'.
    WHEN p_csv.  lv_ext = 'csv'.
    WHEN p_md.   lv_ext = 'md'.
  ENDCASE.

  CONCATENATE 'sap_table_meta_' sy-sysid '_' sy-datum '.' lv_ext
    INTO lv_filename.

  SPLIT gv_output AT gv_nl INTO TABLE lt_data.

  cl_gui_frontend_services=>gui_download(
    EXPORTING
      filename              = lv_filename
      write_field_separator = abap_true
    CHANGING
      data_tab              = lt_data
    EXCEPTIONS
      OTHERS                = 1 ).

  IF sy-subrc = 0.
    CONCATENATE 'File scaricato: ' lv_filename INTO lv_msg.
    MESSAGE lv_msg TYPE 'S'.
  ELSE.
    MESSAGE 'Errore durante il download.' TYPE 'E'.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form COPY_TO_CLIPBOARD
*&---------------------------------------------------------------------*
FORM copy_to_clipboard.

  DATA: lt_lines TYPE STANDARD TABLE OF char255,
        lv_rc    TYPE i.

  SPLIT gv_output AT gv_nl INTO TABLE lt_lines.

  cl_gui_frontend_services=>clipboard_export(
    IMPORTING
      data       = lt_lines
    CHANGING
      rc         = lv_rc
  ).

  IF lv_rc = 0.
    MESSAGE 'Output copiato negli appunti.' TYPE 'S'.
  ELSE.
    MESSAGE 'Errore durante la copia negli appunti.' TYPE 'W'.
  ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& Form SAVE_TO_SERVER
*&---------------------------------------------------------------------*
FORM save_to_server.

  DATA: lt_lines TYPE STANDARD TABLE OF string,
        lv_line  TYPE string,
        lv_msg   TYPE char80.

  SPLIT gv_output AT gv_nl INTO TABLE lt_lines.

  OPEN DATASET p_fpath FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
  IF sy-subrc <> 0.
    CONCATENATE 'Impossibile aprire file: ' p_fpath INTO lv_msg.
    MESSAGE lv_msg TYPE 'E'.
    RETURN.
  ENDIF.

  LOOP AT lt_lines INTO lv_line.
    TRANSFER lv_line TO p_fpath.
  ENDLOOP.

  CLOSE DATASET p_fpath.

  CONCATENATE 'File salvato: ' p_fpath INTO lv_msg.
  MESSAGE lv_msg TYPE 'S'.

ENDFORM.
